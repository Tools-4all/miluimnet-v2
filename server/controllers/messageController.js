// Controller של הצ'אט: רשימת שיחות, מונה הודעות שלא נקראו, והיסטוריית שיחה.
// השליחה עצמה בזמן אמת עוברת ב-Socket.io (server/socket.js). הכללים - ב-services/chat.js
const mongoose = require('mongoose')
const Message = require('../models/Message')
const { canChat, markRead } = require('../services/chat')

// GET /api/messages/conversations - כל השיחות שלי: עם מי, ההודעה האחרונה, וכמה לא נקראו
async function conversations(req, res) {
  const me = new mongoose.Types.ObjectId(req.session.userId)

  const list = await Message.aggregate([
    // כל ההודעות ששלחתי או קיבלתי
    { $match: { $or: [{ from: me }, { to: me }] } },
    { $sort: { createdAt: -1 } },
    // "הצד השני" בכל הודעה: אם אני השולח - הנמען, ואחרת - השולח
    { $addFields: { other: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] } } },
    // קיבוץ לפי הצד השני: ההודעה הראשונה (= האחרונה בזמן, בגלל המיון) + ספירת הודעות שלא קראתי
    {
      $group: {
        _id: '$other',
        lastText: { $first: '$text' },
        lastAt: { $first: '$createdAt' },
        lastFromMe: { $first: { $eq: ['$from', me] } },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$read', false] }] }, 1, 0] } },
      },
    },
    { $sort: { lastAt: -1 } },
    // $lookup - מביא את פרטי המשתמש מהאוסף users (כמו populate, אבל בתוך aggregation)
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        lastText: 1,
        lastAt: 1,
        lastFromMe: 1,
        unread: 1,
        user: { _id: 1, username: 1, displayName: 1, avatar: 1, unit: 1 },
      },
    },
  ])
  res.json(list)
}

// GET /api/messages/unread-count - כמה הודעות לא קראתי (למונה בתפריט)
async function unreadCount(req, res) {
  const count = await Message.countDocuments({ to: req.session.userId, read: false })
  res.json({ count })
}

// GET /api/messages/:userId - ההודעות ביני לבין משתמש אחד (200 האחרונות). גם מסמן אותן כנקראו
async function history(req, res) {
  const { me, otherUser } = req // מ-loadOtherUser
  const messages = await Message.find({
    $or: [
      { from: me._id, to: otherUser._id },
      { from: otherUser._id, to: me._id },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(200)

  await markRead(otherUser._id, me._id)

  res.json({
    user: otherUser.toPublic(),
    canChat: await canChat(me._id, otherUser._id),
    messages: messages.reverse(), // מהישנה לחדשה - כמו שמציגים בצ'אט
  })
}

module.exports = { conversations, unreadCount, history }
