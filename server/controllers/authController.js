// Controller של התחברות: הרשמה, כניסה, יציאה, ו"מי אני".
// ה-controller רק מנהל את הבקשה והתשובה. הסיסמאות וההצפנה מטופלות במודל User.
const User = require('../models/User')
const httpError = require('../utils/httpError')

// שומרים ב-session מי מחובר. express-session שולח לדפדפן cookie עם מזהה ה-session
function startSession(req, user) {
  req.session.userId = user._id.toString()
  req.session.role = user.role
}

// POST /api/auth/register
async function register(req, res) {
  const { username, password, displayName, unit, city } = req.body
  const passwordHash = await User.hashPassword(password)
  // שאר הבדיקות (שם משתמש תקין, תפוס וכו') נעשות במודל - וה-errorHandler מחזיר הודעה
  const user = await User.create({ username, passwordHash, displayName, unit, city })
  startSession(req, user)
  res.status(201).json(user.toSelf())
}

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    throw httpError(400, 'חובה למלא שם משתמש וסיסמה')
  }

  // select('+passwordHash') - מבקשים במפורש את השדה שמוסתר כברירת מחדל
  const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+passwordHash')
  if (!user || !(await user.checkPassword(password))) {
    // אותה הודעה בשני המקרים - כדי לא לגלות לפורץ אם שם המשתמש קיים
    throw httpError(401, 'שם משתמש או סיסמה שגויים')
  }

  startSession(req, user)
  res.json(user.toSelf())
}

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
}

// GET /api/auth/me - מי מחובר עכשיו (או null)
async function me(req, res) {
  if (!req.session.userId) return res.json(null)
  const user = await User.findById(req.session.userId)
  res.json(user ? user.toSelf() : null)
}

module.exports = { register, login, logout, me }
