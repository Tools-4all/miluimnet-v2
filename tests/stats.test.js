// בדיקות אוטומטיות לסטטיסטיקות: הנתונים לגרפים מחושבים מהמסד ברגע הבקשה
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, registerUser } = require('./helpers')

let base
let stop
let alice
before(async () => {
  ;({ base, stop } = await startServer())
  alice = await registerUser(base, 'alice')
})
after(() => stop())

test('רק משתמש מחובר רואה סטטיסטיקות', async () => {
  const res = await fetch(base + '/stats')
  assert.equal(res.status, 401)
})

test('הסטטיסטיקות משקפות את מה שיש במסד', async () => {
  const group = await alice.client.post('/groups', { name: 'קבוצה פעילה', unitType: 'אחר', region: 'מרכז' })
  await alice.client.post('/posts', { text: 'פוסט ראשון', group: group.data._id })
  await alice.client.post('/posts', { text: 'מוכר קסדה', type: 'sale', price: 50, group: group.data._id })
  await alice.client.post('/posts', { text: 'פוסט אישי' })

  const { data } = await alice.client.get('/stats')
  assert.deepEqual(data.totals, { users: 1, groups: 1, posts: 3, sales: 1, messages: 0 })

  // 12 חודשים, והחודש האחרון הוא החודש הנוכחי
  assert.equal(data.postsPerMonth.length, 12)
  const thisMonth = data.postsPerMonth.at(-1)
  const currentMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jerusalem' }).slice(0, 7) // בשעון ישראל, כמו השרת
  assert.deepEqual(thisMonth, { month: currentMonth, posts: 3, sales: 1, avgPerGroup: 2 })
  assert.ok(data.postsPerMonth.slice(0, -1).every((m) => m.posts === 0))

  assert.deepEqual(data.topGroups.map((g) => [g.name, g.posts, g.members]), [['קבוצה פעילה', 2, 1]])
})
