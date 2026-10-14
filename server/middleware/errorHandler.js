// טיפול מרוכז בשגיאות.
// כל שגיאה שנזרקת ב-controller מגיעה לכאן, והשרת מחזיר הודעה מסודרת במקום לקרוס.

// כתובת API שלא קיימת
function notFound(req, res) {
  res.status(404).json({ error: 'הכתובת לא נמצאה' })
}

// Express מזהה middleware של שגיאות לפי 4 הפרמטרים (err, req, res, next)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // שגיאת בדיקת תקינות של Mongoose (למשל שדה חובה חסר)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ error: messages.join(', ') })
  }

  // מזהה (id) לא תקין, למשל /api/posts/abc
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'מזהה לא תקין' })
  }

  // ערך שחייב להיות ייחודי כבר קיים (למשל שם משתמש תפוס)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const names = { username: 'שם המשתמש', name: 'השם' }
    return res.status(409).json({ error: `${names[field] || field} כבר תפוס` })
  }

  // הלקוח שלח JSON שבור
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'הנתונים שנשלחו לא תקינים' })
  }

  // הבקשה גדולה מדי (למשל תמונה ענקית)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'הנתונים שנשלחו גדולים מדי' })
  }

  // שגיאה שאנחנו זרקנו בכוונה, עם קוד סטטוס (ראו utils/httpError.js)
  if (err.status) {
    return res.status(err.status).json({ error: err.message })
  }

  console.error(err)
  res.status(500).json({ error: 'שגיאת שרת' })
}

module.exports = { notFound, errorHandler }
