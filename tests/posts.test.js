// בדיקות אוטומטיות לפוסטים: הרשאות צפייה (קבוצה פרטית), פיד, חיפוש מתקדם, עריכה ומחיקה, לייקים
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, registerUser } = require('./helpers')

let base
let stop
let alice // מנהלת קבוצה פרטית
let bob // חבר בקבוצה
let carol // לא חברה בקבוצה
let privateGroupId
let groupPostId
let salePostId
before(async () => {
  ;({ base, stop } = await startServer())
  alice = await registerUser(base, 'alice')
  bob = await registerUser(base, 'bob')
  carol = await registerUser(base, 'carol')

  const group = await alice.client.post('/groups', { name: 'פלוגה פרטית', unitType: 'הנדסה', region: 'דרום', privacy: 'private' })
  privateGroupId = group.data._id
  await bob.client.post(`/groups/${privateGroupId}/join`)
  await alice.client.post(`/groups/${privateGroupId}/requests/${bob.user._id}/approve`)
})
after(() => stop())

test('יצירת פוסט: בדיקות תקינות', async () => {
  assert.equal((await bob.client.post('/posts', { text: '   ' })).status, 400)
  const noPrice = await bob.client.post('/posts', { text: 'מוכר אפוד', type: 'sale' })
  assert.equal(noPrice.status, 400)
  assert.match(noPrice.data.error, /מחיר/)
  const badVideo = await bob.client.post('/posts', { text: 'סרטון', videoUrl: 'javascript:alert(1)' })
  assert.equal(badVideo.status, 400)
})

test('רק חברי הקבוצה יכולים לפרסם בה', async () => {
  const outsider = await carol.client.post('/posts', { text: 'שלום', group: privateGroupId })
  assert.equal(outsider.status, 403)

  const member = await bob.client.post('/posts', { text: 'נפגשים ביום חמישי בבסיס', group: privateGroupId })
  assert.equal(member.status, 201)
  assert.equal(member.data.group.name, 'פלוגה פרטית')
  assert.equal(member.data.canEdit, true)
  groupPostId = member.data._id
})

test('פוסט בקבוצה פרטית: מי שלא חבר לא רואה אותו, גם לא דרך חיפוש', async () => {
  assert.equal((await carol.client.get('/posts/' + groupPostId)).status, 404)
  const search = await carol.client.get('/posts?q=' + encodeURIComponent('חמישי'))
  assert.equal(search.data.length, 0)
  assert.equal((await carol.client.post(`/posts/${groupPostId}/like`)).status, 404)

  assert.equal((await alice.client.get('/posts/' + groupPostId)).status, 200)
})

test('פיד: פוסטים מהקבוצות שלי ושלי עצמי', async () => {
  const sale = await bob.client.post('/posts', { text: 'מוכר נעלי צבא מידה 44', type: 'sale', price: 150 })
  assert.equal(sale.status, 201)
  salePostId = sale.data._id

  const bobFeed = await bob.client.get('/posts/feed')
  assert.deepEqual(bobFeed.data.map((p) => p._id).sort(), [groupPostId, salePostId].sort())

  // אליס חברה בקבוצה אבל לא חברה של בוב - רואה רק את הפוסט מהקבוצה
  const aliceFeed = await alice.client.get('/posts/feed')
  assert.deepEqual(aliceFeed.data.map((p) => p._id), [groupPostId])
})

test('חיפוש מתקדם: טקסט, סוג, טווח מחירים וטווח תאריכים', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const found = await bob.client.get(
    `/posts?q=${encodeURIComponent('נעלי')}&type=sale&minPrice=100&maxPrice=200&from=${today}&to=${today}`,
  )
  assert.deepEqual(found.data.map((p) => p._id), [salePostId])

  const tooExpensive = await bob.client.get('/posts?type=sale&minPrice=200')
  assert.equal(tooExpensive.data.length, 0)

  assert.equal((await bob.client.get('/posts?minPrice=-5')).status, 400)
  assert.equal((await bob.client.get('/posts?minPrice=300&maxPrice=100')).status, 400)
  assert.equal((await bob.client.get('/posts?from=not-a-date')).status, 400)
  assert.equal((await bob.client.get('/posts?type=hacked')).status, 400)
  assert.equal((await bob.client.get('/posts?group=123')).status, 400)
})

test('עריכה: רק הכותב. פוסט רגיל מאבד את המחיר', async () => {
  assert.equal((await alice.client.put('/posts/' + groupPostId, { text: 'נפרץ' })).status, 403)

  const edited = await bob.client.put('/posts/' + salePostId, { sold: true })
  assert.equal(edited.data.sold, true)

  const toRegular = await bob.client.put('/posts/' + salePostId, { type: 'regular' })
  assert.equal(toRegular.data.price, undefined)
  assert.equal(toRegular.data.sold, false)
})

test('לייק ולחיצה נוספת שמבטלת אותו', async () => {
  const like = await alice.client.post(`/posts/${groupPostId}/like`)
  assert.deepEqual(like.data, { liked: true, likesCount: 1 })
  const unlike = await alice.client.post(`/posts/${groupPostId}/like`)
  assert.deepEqual(unlike.data, { liked: false, likesCount: 0 })
})

test('מחיקה: מנהלת הקבוצה יכולה למחוק פוסט של חבר, משתמש אחר לא', async () => {
  const second = await bob.client.post('/posts', { text: 'עוד פוסט', group: privateGroupId })
  assert.equal(second.data.canDelete, true)

  const asAlice = await alice.client.get('/posts/' + second.data._id)
  assert.equal(asAlice.data.canEdit, false)
  assert.equal(asAlice.data.canDelete, true)

  assert.equal((await carol.client.delete('/posts/' + salePostId)).status, 404) // לא חברה של בוב - לא רואה
  assert.equal((await alice.client.delete('/posts/' + second.data._id)).status, 200)
})

test('מחיקת קבוצה מוחקת את הפוסטים שלה', async () => {
  assert.equal((await alice.client.delete('/groups/' + privateGroupId)).status, 200)
  assert.equal((await bob.client.get('/posts/' + groupPostId)).status, 404)
})

test('מחיקת חשבון מוחקת את הפוסטים שלו', async () => {
  // פוסט בקבוצה ציבורית - כך קרול רואה אותו לפני המחיקה, והבדיקה באמת בודקת משהו
  const group = await carol.client.post('/groups', { name: 'קבוצה ציבורית', unitType: 'אחר', region: 'מרכז' })
  await bob.client.post(`/groups/${group.data._id}/join`)
  await bob.client.post('/posts', { text: 'שלום לכולם', group: group.data._id })
  assert.equal((await carol.client.get('/posts?author=' + bob.user._id)).data.length, 1)

  await bob.client.delete('/users/me')
  assert.equal((await carol.client.get('/posts?author=' + bob.user._id)).data.length, 0)
})
