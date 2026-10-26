// הכללים של הצ'אט - משמשים גם את ה-API (היסטוריה) וגם את Socket.io (שליחה בזמן אמת).
// נוגעים בשלושה מודלים (משתמש, קבוצה, הודעה), ולכן כתובים כאן ולא ב-controller.
const mongoose = require('mongoose')
const User = require('../models/User')
const Group = require('../models/Group')
const Message = require('../models/Message')
const httpError = require('../utils/httpError')

// מותר לשוחח עם מישהו אם אתם חברים, או שאתם באותה קבוצה
async function canChat(meId, otherId) {
  const me = await User.findById(meId).select('friends')
  if (!me) return false
  if (me.isFriendWith(otherId)) return true
  // $all - קבוצה שבמערך החברים שלה נמצאים שנינו
  return Boolean(await Group.exists({ members: { $all: [meId, otherId] } }))
}

// בדיקות + שמירה של הודעה חדשה
async function saveMessage(fromId, toId, text) {
  if (!mongoose.isValidObjectId(toId)) throw httpError(400, 'נמען לא תקין')
  if (String(fromId) === String(toId)) throw httpError(400, 'אי אפשר לשלוח הודעה לעצמך')
  if (typeof text !== 'string' || !text.trim()) throw httpError(400, 'אי אפשר לשלוח הודעה ריקה')
  if (!(await User.exists({ _id: toId }))) throw httpError(404, 'המשתמש לא נמצא')
  if (!(await canChat(fromId, toId))) throw httpError(403, 'אפשר לשלוח הודעות רק לחברים או לחברי קבוצה משותפת')

  return Message.create({ from: fromId, to: toId, text })
}

// מסמן כנקראו את כל ההודעות ש-fromId שלח ל-toId
async function markRead(fromId, toId) {
  if (!mongoose.isValidObjectId(fromId)) return
  await Message.updateMany({ from: fromId, to: toId, read: false }, { read: true })
}

module.exports = { canChat, saveMessage, markRead }
