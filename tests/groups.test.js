// בדיקות אוטומטיות לקבוצות: הרשאות מנהל, קבוצה פרטית, בקשות הצטרפות וחיפוש מתקדם
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, registerUser } = require('./helpers')

let base
let stop
let alice // מנהלת הקבוצה
let bob // משתמש רגיל
let groupId
before(async () => {
  ;({ base, stop } = await startServer())
  alice = await registerUser(base, 'alice')
  bob = await registerUser(base, 'bob')
})
after(() => stop())

const PRIVATE_GROUP = { name: 'גדוד 9999 - בדיקה', unitType: 'שריון', region: 'צפון', privacy: 'private', description: 'קבוצת בדיקה' }

test('/api/meta מחזיר את הרשימות הקבועות', async () => {
  const res = await alice.client.get('/meta')
  assert.ok(res.data.unitTypes.includes('שריון'))
  assert.ok(res.data.regions.includes('צפון'))
})

test('יצירת קבוצה: בדיקות תקינות, ומי שיוצר הופך למנהל', async () => {
  const invalid = await alice.client.post('/groups', { name: 'x' })
  assert.equal(invalid.status, 400)
  assert.match(invalid.data.error, /סוג יחידה/)

  const badEnum = await alice.client.post('/groups', { ...PRIVATE_GROUP, unitType: 'צוללות' })
  assert.equal(badEnum.status, 400)

  const created = await alice.client.post('/groups', PRIVATE_GROUP)
  assert.equal(created.status, 201)
  groupId = created.data._id
  assert.equal(created.data.admin, alice.user._id)
  assert.deepEqual(created.data.members, [alice.user._id])

  const duplicate = await bob.client.post('/groups', PRIVATE_GROUP)
  assert.equal(duplicate.status, 409)
})

test('קבוצה פרטית: מי שלא חבר לא רואה את החברים', async () => {
  const res = await bob.client.get('/groups/' + groupId)
  assert.equal(res.data.canSeeContent, false)
  assert.deepEqual(res.data.members, [])
  assert.equal(res.data.memberCount, 1)
})

test('רק המנהלת יכולה לערוך, למחוק ולאשר', async () => {
  assert.equal((await bob.client.put('/groups/' + groupId, { name: 'נפרץ' })).status, 403)
  assert.equal((await bob.client.delete('/groups/' + groupId)).status, 403)
  assert.equal((await bob.client.post(`/groups/${groupId}/requests/${bob.user._id}/approve`)).status, 403)
})

test('בקשת הצטרפות לקבוצה פרטית ואישור שלה', async () => {
  const join = await bob.client.post(`/groups/${groupId}/join`)
  assert.equal(join.data.status, 'requested')
  assert.equal((await bob.client.get('/groups/' + groupId)).data.hasRequested, true)

  // המנהלת רואה את הבקשה ומאשרת
  const asAdmin = await alice.client.get('/groups/' + groupId)
  assert.deepEqual(asAdmin.data.pendingRequests.map((u) => u.username), ['bob'])
  assert.equal((await alice.client.post(`/groups/${groupId}/requests/${bob.user._id}/approve`)).status, 200)

  const asMember = await bob.client.get('/groups/' + groupId)
  assert.equal(asMember.data.isMember, true)
  assert.equal(asMember.data.canSeeContent, true)
  assert.equal(asMember.data.memberCount, 2)
})

test('חיפוש מתקדם: שם, סוג יחידה, אזור, מינימום חברים, ורק שלי', async () => {
  const match = await bob.client.get(
    `/groups?unitType=${encodeURIComponent('שריון')}&region=${encodeURIComponent('צפון')}&minMembers=2&q=9999`,
  )
  assert.equal(match.data.length, 1)
  assert.equal(match.data[0].memberCount, 2)
  assert.equal(match.data[0].isMember, true)

  const tooMany = await bob.client.get('/groups?minMembers=5')
  assert.equal(tooMany.data.length, 0)

  const mine = await bob.client.get('/groups?mine=true')
  assert.equal(mine.data.length, 1)

  const bad = await bob.client.get('/groups?minMembers=abc')
  assert.equal(bad.status, 400)
})

test('מנהלת לא יכולה לעזוב, אבל יכולה להוציא חבר', async () => {
  const leave = await alice.client.post(`/groups/${groupId}/leave`)
  assert.equal(leave.status, 400)
  const remove = await alice.client.delete(`/groups/${groupId}/members/${bob.user._id}`)
  assert.equal(remove.status, 200)
  assert.equal((await bob.client.get('/groups/' + groupId)).data.isMember, false)
})

test('קבוצה ציבורית: מצטרפים מיד', async () => {
  const pub = await alice.client.post('/groups', { name: 'חטיבה 551 - בדיקה', unitType: 'חי"ר', region: 'מרכז' })
  const join = await bob.client.post(`/groups/${pub.data._id}/join`)
  assert.equal(join.data.status, 'joined')
  const again = await bob.client.post(`/groups/${pub.data._id}/join`)
  assert.equal(again.status, 400)
})

test('מזהה לא תקין וקבוצה שלא קיימת', async () => {
  assert.equal((await bob.client.get('/groups/abc')).status, 400)
  assert.equal((await bob.client.post('/groups/64b000000000000000000000/join')).status, 404)
})

test('מחיקת חשבון המנהלת מוחקת את הקבוצות שניהלה', async () => {
  await alice.client.delete('/users/me')
  assert.equal((await bob.client.get('/groups/' + groupId)).status, 404)
  assert.equal((await bob.client.get('/groups?mine=true')).data.length, 0)
})
