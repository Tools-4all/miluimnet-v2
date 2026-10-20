// בדיקות אוטומטיות לניהול משתמשים: רשימה, חיפוש, פרופיל, עדכון ומחיקה
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, createClient, registerUser } = require('./helpers')

let base
let stop
let dani
let noa
before(async () => {
  ;({ base, stop } = await startServer())
  dani = await registerUser(base, 'dani', { displayName: 'דני כהן', unit: 'גדוד 8101', city: 'חיפה' })
  noa = await registerUser(base, 'noa', { displayName: 'נועה לוי', unit: 'גדוד 9213', city: 'תל אביב' })
})
after(() => stop())

test('רשימת משתמשים דורשת התחברות', async () => {
  const res = await createClient(base).get('/users')
  assert.equal(res.status, 401)
})

test('חיפוש לפי שם, יחידה ועיר', async () => {
  const byName = await dani.client.get('/users?q=' + encodeURIComponent('נועה'))
  assert.deepEqual(byName.data.map((u) => u.username), ['noa'])

  const byUnitAndCity = await dani.client.get(`/users?unit=8101&city=${encodeURIComponent('חיפה')}`)
  assert.deepEqual(byUnitAndCity.data.map((u) => u.username), ['dani'])

  const none = await dani.client.get('/users?unit=9999')
  assert.equal(none.data.length, 0)
})

test('תווים מיוחדים בחיפוש לא שוברים אותו', async () => {
  const res = await dani.client.get('/users?q=' + encodeURIComponent('.*('))
  assert.equal(res.status, 200)
  assert.equal(res.data.length, 0)
})

test('אף פעם לא מוחזרת סיסמה', async () => {
  const list = await dani.client.get('/users')
  assert.ok(list.data.every((u) => u.passwordHash === undefined))
})

test('פרופיל: מזהה לא תקין ומשתמש שלא קיים', async () => {
  assert.equal((await dani.client.get('/users/abc')).status, 400)
  assert.equal((await dani.client.get('/users/64b000000000000000000000')).status, 404)
  const ok = await dani.client.get('/users/' + noa.user._id)
  assert.equal(ok.data.displayName, 'נועה לוי')
})

test('עדכון פרופיל: רק שדות מותרים, עם בדיקות תקינות', async () => {
  const updated = await dani.client.put('/users/me', { bio: 'מילואימניק', role: 'admin', username: 'hacker' })
  assert.equal(updated.status, 200)
  assert.equal(updated.data.bio, 'מילואימניק')
  assert.equal(updated.data.role, 'user') // אי אפשר להפוך את עצמך למנהל
  assert.equal(updated.data.username, 'dani') // ואי אפשר לשנות שם משתמש

  const tooShort = await dani.client.put('/users/me', { displayName: 'א' })
  assert.equal(tooShort.status, 400)
})

test('מחיקת חשבון: נמחק, מתנתק, ויוצא מרשימות של אחרים', async () => {
  const temp = await registerUser(base, 'temp_user')
  const res = await temp.client.delete('/users/me')
  assert.equal(res.status, 200)
  assert.equal((await temp.client.get('/auth/me')).data, null)
  const login = await createClient(base).post('/auth/login', { username: 'temp_user', password: 'secret12' })
  assert.equal(login.status, 401)
})
