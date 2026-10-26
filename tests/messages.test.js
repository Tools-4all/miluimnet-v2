// בדיקות אוטומטיות לצ'אט: שליחה בזמן אמת ב-Socket.io, הרשאות, היסטוריה ומונה הודעות שלא נקראו
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { io: connect } = require('socket.io-client')
const { startServer, registerUser } = require('./helpers')

let base
let origin
let stop
let alice
let bob
let stranger
const sockets = []
before(async () => {
  ;({ base, origin, stop } = await startServer())
  alice = await registerUser(base, 'alice')
  bob = await registerUser(base, 'bob')
  stranger = await registerUser(base, 'stranger')
  await alice.client.post('/friends/requests/' + bob.user._id)
  await bob.client.post(`/friends/requests/${alice.user._id}/accept`)
})
after(async () => {
  sockets.forEach((s) => s.disconnect())
  await stop()
})

// מתחבר ל-Socket.io עם ה-cookie של המשתמש, כמו שהדפדפן עושה
async function openSocket(who) {
  const socket = connect(origin, { extraHeaders: { cookie: who.client.cookie() }, transports: ['websocket'] })
  sockets.push(socket)
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve)
    socket.once('connect_error', reject)
  })
  return socket
}

const send = (socket, payload) => new Promise((resolve) => socket.emit('message:send', payload, resolve))

test('מי שלא מחובר לאתר מנותק מהצ\'אט', async () => {
  const socket = connect(origin, { transports: ['websocket'] })
  sockets.push(socket)
  await new Promise((resolve) => socket.once('disconnect', resolve))
})

test('הודעה בין חברים מגיעה לנמען בזמן אמת', async () => {
  const aliceSocket = await openSocket(alice)
  const bobSocket = await openSocket(bob)

  const received = new Promise((resolve) => bobSocket.once('message:new', resolve))
  const ack = await send(aliceSocket, { to: bob.user._id, text: 'מגיע מחר לאימון?' })
  assert.equal(ack.ok, true)

  const message = await received
  assert.equal(message.text, 'מגיע מחר לאימון?')
  assert.equal(message.from, alice.user._id)
})

test('הודעות לא תקינות חוזרות כשגיאה, והשרת ממשיך לעבוד', async () => {
  const aliceSocket = await openSocket(alice)
  assert.match((await send(aliceSocket, { to: stranger.user._id, text: 'היי' })).error, /רק לחברים/)
  assert.match((await send(aliceSocket, { to: bob.user._id, text: '   ' })).error, /ריקה/)
  assert.match((await send(aliceSocket, { to: 'abc', text: 'היי' })).error, /נמען לא תקין/)
  assert.match((await send(aliceSocket, { to: bob.user._id, text: 'א'.repeat(1001) })).error, /ארוכה מדי/)
  assert.match((await send(aliceSocket, {})).error, /נמען/)
  assert.equal((await alice.client.get('/health')).status, 200)
})

test('מונה הודעות שלא נקראו, רשימת שיחות, והיסטוריה שמסמנת כנקרא', async () => {
  assert.equal((await bob.client.get('/messages/unread-count')).data.count, 1)

  const conversations = await bob.client.get('/messages/conversations')
  assert.equal(conversations.data[0].user.username, 'alice')
  assert.equal(conversations.data[0].unread, 1)

  const history = await bob.client.get('/messages/' + alice.user._id)
  assert.equal(history.data.canChat, true)
  assert.deepEqual(history.data.messages.map((m) => m.text), ['מגיע מחר לאימון?'])
  assert.equal((await bob.client.get('/messages/unread-count')).data.count, 0)

  const withStranger = await stranger.client.get('/messages/' + alice.user._id)
  assert.equal(withStranger.data.canChat, false)
})

test('מחיקת חשבון מוחקת את ההודעות שלו', async () => {
  await alice.client.delete('/users/me')
  assert.equal((await bob.client.get('/messages/conversations')).data.length, 0)
})
