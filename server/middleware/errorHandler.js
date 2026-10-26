// טיפול מרוכז בשגיאות.
// כל שגיאה שנזרקת ב-controller מגיעה לכאן, והשרת מחזיר הודעה מסודרת במקום לקרוס.
// איזו הודעה מתאימה לאיזו שגיאה - כתוב ב-utils/errorResponse.js
const errorResponse = require('../utils/errorResponse')

// כתובת API שלא קיימת
function notFound(req, res) {
  res.status(404).json({ error: 'הכתובת לא נמצאה' })
}

// Express מזהה middleware של שגיאות לפי 4 הפרמטרים (err, req, res, next)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { status, error } = errorResponse(err)
  res.status(status).json({ error })
}

module.exports = { notFound, errorHandler }
