// הגדרת אפליקציית Express: middleware, נתיבים (routes) וטיפול בשגיאות
const express = require('express')
const createSession = require('./config/session')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const groupRoutes = require('./routes/groupRoutes')
const metaRoutes = require('./routes/metaRoutes')

const app = express()

// מאפשר לקרוא גוף בקשה בפורמט JSON (req.body). מגבלה גבוהה כי תמונות יישלחו כטקסט
app.use(express.json({ limit: '5mb' }))

// ---------- Session (מי מחובר) ----------
const { middleware: sessionMiddleware, store: sessionStore } = createSession()
app.use(sessionMiddleware)
// שומרים על app: את ה-middleware בשביל Socket.io (הצ'אט), ואת ה-store כדי לסגור אותו בבדיקות
app.set('sessionMiddleware', sessionMiddleware)
app.set('sessionStore', sessionStore)

// ---------- נתיבי ה-API ----------
// בדיקה שהשרת חי
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date() })
})
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/meta', metaRoutes)

// כל נתיב /api אחר שלא קיים - 404 בפורמט JSON
app.use('/api', notFound)

// חייב להיות אחרון - תופס את כל השגיאות
app.use(errorHandler)

module.exports = app
