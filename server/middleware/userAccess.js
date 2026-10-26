// middleware לפעולות על משתמש אחר (חברות, צ'אט): בודק שה-id בכתובת תקין, שהמשתמש קיים ושזה לא אני.
// שם ב-req את שני המשתמשים: req.me ו-req.otherUser
const mongoose = require('mongoose')
const User = require('../models/User')
const httpError = require('../utils/httpError')

async function loadOtherUser(req, res, next) {
  const { userId } = req.params
  if (!mongoose.isValidObjectId(userId)) throw httpError(400, 'מזהה משתמש לא תקין')
  if (userId === req.session.userId) throw httpError(400, 'אי אפשר לבצע את הפעולה על עצמך')

  const [me, other] = await Promise.all([User.findById(req.session.userId), User.findById(userId)])
  if (!me) throw httpError(401, 'צריך להתחבר')
  if (!other) throw httpError(404, 'המשתמש לא נמצא')
  req.me = me
  req.otherUser = other
  next()
}

module.exports = { loadOtherUser }
