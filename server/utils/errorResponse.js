// מתרגם שגיאה לתשובה מסודרת: { status, error }.
// משמש גם את errorHandler (בקשות HTTP) וגם את הצ'אט (Socket.io), כדי ששניהם יחזירו אותן הודעות.
function errorResponse(err) {
  // שגיאת בדיקת תקינות של Mongoose (למשל שדה חובה חסר)
  if (err.name === 'ValidationError') {
    return { status: 400, error: Object.values(err.errors).map((e) => e.message).join(', ') }
  }
  // מזהה (id) לא תקין, למשל /api/posts/abc
  if (err.name === 'CastError') return { status: 400, error: 'מזהה לא תקין' }
  // ערך שחייב להיות ייחודי כבר קיים (למשל שם משתמש תפוס)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const names = { username: 'שם המשתמש', name: 'השם' }
    return { status: 409, error: `${names[field] || field} כבר תפוס` }
  }
  // הלקוח שלח JSON שבור
  if (err.type === 'entity.parse.failed') return { status: 400, error: 'הנתונים שנשלחו לא תקינים' }
  // הבקשה גדולה מדי (למשל תמונה ענקית)
  if (err.type === 'entity.too.large') return { status: 413, error: 'הנתונים שנשלחו גדולים מדי' }
  // שגיאה שאנחנו זרקנו בכוונה, עם קוד סטטוס (ראו utils/httpError.js)
  if (err.status) return { status: err.status, error: err.message }

  // שגיאה שלא צפינו - נרשמת בטרמינל, והמשתמש מקבל הודעה כללית
  console.error(err)
  return { status: 500, error: 'שגיאת שרת' }
}

module.exports = errorResponse
