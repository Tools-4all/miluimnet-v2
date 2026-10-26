// Controller של משתמשים: רשימה וחיפוש, פרופיל, עדכון ומחיקה
const User = require('../models/User')
const httpError = require('../utils/httpError')
const escapeRegex = require('../utils/escapeRegex')
const { deleteUserData } = require('../services/userData')

// GET /api/users?q=&unit=&city= - רשימת משתמשים עם חיפוש
async function listUsers(req, res) {
  const { q, unit, city } = req.query
  const filter = {}

  // $or - מספיק שאחד התנאים מתקיים. RegExp עם 'i' - חיפוש חלקי בלי הבדל אותיות גדולות/קטנות
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i')
    filter.$or = [{ username: regex }, { displayName: regex }]
  }
  if (unit) filter.unit = new RegExp(escapeRegex(unit), 'i')
  if (city) filter.city = new RegExp(escapeRegex(city), 'i')

  const users = await User.find(filter).sort({ displayName: 1 }).limit(100)
  res.json(users.map((u) => u.toPublic()))
}

// GET /api/users/:id - פרופיל של משתמש אחד, כולל הקשר ביני לבינו (חברים / בקשה / כלום)
async function getUser(req, res) {
  const [user, me] = await Promise.all([User.findById(req.params.id), User.findById(req.session.userId)])
  if (!user) throw httpError(404, 'המשתמש לא נמצא')
  res.json({ ...user.toPublic(), friendsCount: user.friends.length, friendship: me ? me.friendshipWith(user) : 'none' })
}

// PUT /api/users/me - עדכון הפרופיל שלי
async function updateMe(req, res) {
  const user = await User.findById(req.session.userId)
  if (!user) throw httpError(404, 'המשתמש לא נמצא')

  // מעדכנים רק שדות שמותר למשתמש לשנות (לא role, לא username, לא סיסמה)
  for (const field of ['displayName', 'unit', 'city', 'bio', 'avatar']) {
    if (req.body[field] !== undefined) user[field] = req.body[field]
  }
  // save מריץ את כל בדיקות התקינות של המודל
  await user.save()
  res.json(user.toSelf())
}

// DELETE /api/users/me - מחיקת החשבון שלי
async function deleteMe(req, res) {
  await deleteUserData(req.session.userId)
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
}

module.exports = { listUsers, getUser, updateMe, deleteMe }
