// middleware של הרשאות - רץ לפני ה-controller ובודק שהמשתמש מורשה
const httpError = require('../utils/httpError')

// רק משתמש מחובר יכול להמשיך. אחרי ההתחברות שמרנו את ה-id שלו ב-session
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return next(httpError(401, 'צריך להתחבר'))
  }
  next()
}

// רק מנהל האתר יכול להמשיך
function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    return next(httpError(403, 'הפעולה מותרת רק למנהל האתר'))
  }
  next()
}

module.exports = { requireLogin, requireAdmin }
