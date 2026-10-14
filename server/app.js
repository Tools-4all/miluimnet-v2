// הגדרת אפליקציית Express: middleware, נתיבים (routes) וטיפול בשגיאות
const express = require('express')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const app = express()

// מאפשר לקרוא גוף בקשה בפורמט JSON (req.body). מגבלה גבוהה כי תמונות יישלחו כטקסט
app.use(express.json({ limit: '5mb' }))

// ---------- נתיבי ה-API ----------
// בדיקה שהשרת חי
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date() })
})

// כל נתיב /api אחר שלא קיים - 404 בפורמט JSON
app.use('/api', notFound)

// חייב להיות אחרון - תופס את כל השגיאות
app.use(errorHandler)

module.exports = app
