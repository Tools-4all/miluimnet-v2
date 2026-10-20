// middleware של קבוצות. במקום שכל פעולה ב-controller תחפש את הקבוצה ותבדוק הרשאות בעצמה,
// הבדיקות כתובות כאן פעם אחת, ומחוברות לכתובות בקובץ routes/groupRoutes.js:
//   router.put('/:id', loadGroup, requireGroupAdmin, groups.updateGroup)
const Group = require('../models/Group')
const httpError = require('../utils/httpError')

// מוצא את הקבוצה לפי ה-id בכתובת ושם אותה ב-req.group (או 404 אם לא קיימת)
async function loadGroup(req, res, next) {
  const group = await Group.findById(req.params.id)
  if (!group) throw httpError(404, 'הקבוצה לא נמצאה')
  req.group = group
  next()
}

// רק מנהל הקבוצה (או מנהל האתר) ממשיך. חייב לבוא אחרי loadGroup
function requireGroupAdmin(req, res, next) {
  if (!req.group.isAdmin(req.session.userId) && req.session.role !== 'admin') {
    throw httpError(403, 'רק מנהל הקבוצה יכול לעשות את זה')
  }
  next()
}

module.exports = { loadGroup, requireGroupAdmin }
