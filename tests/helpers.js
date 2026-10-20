// כלי עזר לבדיקות האוטומטיות.
// הבדיקות רצות מול מסד נתונים נפרד (miluimnet_test), שנמחק בסוף - כך הן לא נוגעות בנתונים האמיתיים.
require('dotenv').config({ quiet: true })

// מחליפים את שם מסד הנתונים בכתובת: .../miluimnet?... -> .../miluimnet_test?...
const url = new URL(process.env.MONGO_URI)
url.pathname = '/miluimnet_test'
process.env.MONGO_URI = url.toString()
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret'

const mongoose = require('mongoose')
const app = require('../server/app')
const { ensureIndexes } = require('../server/config/db')

// מפעיל שרת אמיתי על פורט פנוי, ומחזיר את הכתובת שלו
async function startServer() {
  await mongoose.connect(process.env.MONGO_URI)
  await mongoose.connection.dropDatabase() // מתחילים ממסד נתונים ריק
  await ensureIndexes() // כמו בשרת האמיתי: האינדקסים (למשל unique) קיימים לפני הבקשה הראשונה
  const server = app.listen(0) // 0 = מערכת ההפעלה בוחרת פורט פנוי
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://localhost:${server.address().port}/api`

  async function stop() {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
    await app.get('sessionStore').close()
    await new Promise((resolve) => server.close(resolve))
  }
  return { base, stop }
}

// "לקוח" שזוכר את ה-cookie של ההתחברות, כמו דפדפן
function createClient(base) {
  let cookie = ''
  async function request(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }) },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    const data = await res.json().catch(() => null)
    return { status: res.status, data }
  }
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body ?? {}),
    put: (path, body) => request('PUT', path, body ?? {}),
    delete: (path) => request('DELETE', path),
  }
}

// יוצר משתמש חדש ומחזיר לקוח שמחובר בשמו
async function registerUser(base, username, extra = {}) {
  const client = createClient(base)
  const res = await client.post('/auth/register', {
    username,
    password: 'secret12',
    displayName: extra.displayName || username,
    ...extra,
  })
  if (res.status !== 201) throw new Error(`registration failed: ${JSON.stringify(res.data)}`)
  return { client, user: res.data }
}

module.exports = { startServer, createClient, registerUser }
