// הגדרת אפליקציית Express: middleware, נתיבים (routes) וטיפול בשגיאות
const path = require('path')
const express = require('express')
const createSession = require('./config/session')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const groupRoutes = require('./routes/groupRoutes')
const postRoutes = require('./routes/postRoutes')
const friendRoutes = require('./routes/friendRoutes')
const messageRoutes = require('./routes/messageRoutes')
const statsRoutes = require('./routes/statsRoutes')
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
app.use('/api/posts', postRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/meta', metaRoutes)

// כל נתיב /api אחר שלא קיים - 404 בפורמט JSON
app.use('/api', notFound)

// ---------- האתר עצמו (אחרי npm run build) ----------
// בפיתוח Vite מגיש את הלקוח. אחרי build - השרת מגיש את הקבצים מ-client/dist,
// וכל כתובת אחרת מקבלת את index.html, ו-React Router מציג את העמוד הנכון
const clientDist = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDist))
app.get('/{*path}', (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next()) // אין build - ממשיכים ל-404
})

// חייב להיות אחרון - תופס את כל השגיאות
app.use(errorHandler)

module.exports = app
