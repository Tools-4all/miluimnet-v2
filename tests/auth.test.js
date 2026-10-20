// בדיקות אוטומטיות להרשמה ולהתחברות. הרצה: npm test
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, createClient } = require('./helpers')

let base
let stop
before(async () => ({ base, stop } = await startServer()))
after(() => stop())

test('הרשמה תקינה מחזירה את המשתמש, בלי הסיסמה', async () => {
  const client = createClient(base)
  const res = await client.post('/auth/register', { username: 'Dani_1', password: 'secret12', displayName: 'דני' })
  assert.equal(res.status, 201)
  assert.equal(res.data.username, 'dani_1') // נשמר באותיות קטנות
  assert.equal(res.data.passwordHash, undefined)
  assert.equal(res.data.friendRequestsCount, 0)
})

test('אחרי הרשמה המשתמש מחובר (session)', async () => {
  const client = createClient(base)
  await client.post('/auth/register', { username: 'noa', password: 'secret12', displayName: 'נועה' })
  const me = await client.get('/auth/me')
  assert.equal(me.data.username, 'noa')
})

test('שם משתמש תפוס', async () => {
  const res = await createClient(base).post('/auth/register', { username: 'dani_1', password: 'secret12', displayName: 'אחר' })
  assert.equal(res.status, 409)
  assert.equal(res.data.error, 'שם המשתמש כבר תפוס')
})

test('בדיקות תקינות בהרשמה', async () => {
  const client = createClient(base)
  const shortPassword = await client.post('/auth/register', { username: 'abc', password: '123', displayName: 'x y' })
  assert.equal(shortPassword.status, 400)
  assert.match(shortPassword.data.error, /6 תווים/)

  const badUsername = await client.post('/auth/register', { username: 'a b', password: 'secret12', displayName: 'x y' })
  assert.equal(badUsername.status, 400)
  assert.match(badUsername.data.error, /אותיות באנגלית/)

  const noName = await client.post('/auth/register', { username: 'valid_name', password: 'secret12' })
  assert.equal(noName.status, 400)
  assert.match(noName.data.error, /שם מלא/)
})

test('התחברות: סיסמה שגויה ומשתמש שלא קיים מחזירים אותה הודעה', async () => {
  const client = createClient(base)
  const wrongPassword = await client.post('/auth/login', { username: 'dani_1', password: 'nope123' })
  const noUser = await client.post('/auth/login', { username: 'nobody', password: 'secret12' })
  assert.equal(wrongPassword.status, 401)
  assert.equal(noUser.status, 401)
  assert.equal(wrongPassword.data.error, noUser.data.error)
})

test('התחברות תקינה (לא תלויה באותיות גדולות/קטנות) ויציאה', async () => {
  const client = createClient(base)
  const login = await client.post('/auth/login', { username: 'DANI_1', password: 'secret12' })
  assert.equal(login.status, 200)
  assert.equal((await client.get('/auth/me')).data.username, 'dani_1')

  await client.post('/auth/logout')
  assert.equal((await client.get('/auth/me')).data, null)
})

test('קלט לא תקין לא מפיל את השרת', async () => {
  const client = createClient(base)
  const broken = await client.post('/auth/login', '{bad json')
  assert.equal(broken.status, 400)
  const wrongTypes = await client.post('/auth/login', { username: ['x'], password: { $gt: '' } })
  assert.equal(wrongTypes.status, 400)
  assert.equal((await client.get('/health')).status, 200)
})
