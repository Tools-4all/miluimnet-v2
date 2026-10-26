// בדיקות אוטומטיות לחברים: בקשה, אישור, דחייה, ביטול, הסרה, ומקרי קצה
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { startServer, registerUser } = require('./helpers')

let base
let stop
let alice
let bob
let carol
before(async () => {
  ;({ base, stop } = await startServer())
  alice = await registerUser(base, 'alice')
  bob = await registerUser(base, 'bob')
  carol = await registerUser(base, 'carol')
})
after(() => stop())

const friendshipOf = async (who, other) => (await who.client.get('/users/' + other.user._id)).data.friendship

test('מקרי קצה: מזהה לא תקין, משתמש שלא קיים, ובקשה לעצמי', async () => {
  assert.equal((await alice.client.post('/friends/requests/abc')).status, 400)
  assert.equal((await alice.client.post('/friends/requests/000000000000000000000000')).status, 404)
  assert.equal((await alice.client.post('/friends/requests/' + alice.user._id)).status, 400)
})

test('בקשת חברות ואישור', async () => {
  const sent = await alice.client.post('/friends/requests/' + bob.user._id)
  assert.equal(sent.data.status, 'outgoing')
  assert.equal((await alice.client.post('/friends/requests/' + bob.user._id)).status, 400) // פעמיים

  assert.equal(await friendshipOf(alice, bob), 'outgoing')
  assert.equal(await friendshipOf(bob, alice), 'incoming')
  assert.equal((await bob.client.get('/auth/me')).data.friendRequestsCount, 1)

  const accepted = await bob.client.post(`/friends/requests/${alice.user._id}/accept`)
  assert.equal(accepted.data.status, 'friends')
  assert.equal(await friendshipOf(alice, bob), 'friends')

  const list = await alice.client.get('/friends')
  assert.deepEqual(list.data.friends.map((u) => u.username), ['bob'])
  assert.equal((await bob.client.get('/auth/me')).data.friendRequestsCount, 0)
})

test('בקשה בחזרה למי שכבר ביקש ממני - מאשרת', async () => {
  await carol.client.post('/friends/requests/' + alice.user._id)
  const back = await alice.client.post('/friends/requests/' + carol.user._id)
  assert.equal(back.data.status, 'friends')
})

test('אחרי חברות - רואים את הפוסטים האישיים בפיד', async () => {
  const post = await bob.client.post('/posts', { text: 'פוסט אישי של בוב' })
  const feed = await alice.client.get('/posts/feed')
  assert.ok(feed.data.some((p) => p._id === post.data._id))
})

test('ביטול בקשה, דחייה והסרת חבר', async () => {
  await bob.client.post('/friends/requests/' + carol.user._id)
  await bob.client.delete('/friends/requests/' + carol.user._id)
  assert.equal(await friendshipOf(carol, bob), 'none')

  await bob.client.post('/friends/requests/' + carol.user._id)
  await carol.client.post(`/friends/requests/${bob.user._id}/reject`)
  assert.equal(await friendshipOf(bob, carol), 'none')
  assert.equal((await carol.client.post(`/friends/requests/${bob.user._id}/accept`)).status, 404) // כבר נדחתה

  await alice.client.delete('/friends/' + bob.user._id)
  assert.equal(await friendshipOf(bob, alice), 'none')
})
