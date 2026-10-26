// Controller של חברים: בקשת חברות, אישור, דחייה, ביטול והסרה.
// במודל User: friends = החברים שלי, friendRequests = בקשות שקיבלתי ועוד לא אישרתי.
// req.me ו-req.otherUser מגיעים מ-loadOtherUser (middleware/userAccess.js)
const User = require('../models/User')
const httpError = require('../utils/httpError')

const PUBLIC_FIELDS = 'username displayName avatar unit city'

// מוסיף כל אחד לרשימת החברים של השני, ומוחק את הבקשות ביניהם
async function makeFriends(aId, bId) {
  await User.updateOne({ _id: aId }, { $addToSet: { friends: bId }, $pull: { friendRequests: bId } })
  await User.updateOne({ _id: bId }, { $addToSet: { friends: aId }, $pull: { friendRequests: aId } })
}

// GET /api/friends - החברים שלי והבקשות שקיבלתי
async function myFriends(req, res) {
  const me = await User.findById(req.session.userId)
    .populate('friends', PUBLIC_FIELDS)
    .populate('friendRequests', PUBLIC_FIELDS)
  if (!me) throw httpError(401, 'צריך להתחבר')
  res.json({ friends: me.friends, requests: me.friendRequests })
}

// POST /api/friends/requests/:userId - שליחת בקשת חברות
async function sendRequest(req, res) {
  const { me, otherUser } = req
  const status = me.friendshipWith(otherUser)
  if (status === 'friends') throw httpError(400, 'אתם כבר חברים')
  if (status === 'outgoing') throw httpError(400, 'כבר שלחת בקשה')

  // אם הוא כבר ביקש ממני - שליחת בקשה בחזרה פשוט מאשרת
  if (status === 'incoming') {
    await makeFriends(me._id, otherUser._id)
    return res.json({ status: 'friends' })
  }

  // הבקשה נשמרת אצל מי שמקבל אותה. $addToSet - לא מוסיף פעמיים
  await User.updateOne({ _id: otherUser._id }, { $addToSet: { friendRequests: me._id } })
  res.json({ status: 'outgoing' })
}

// DELETE /api/friends/requests/:userId - ביטול בקשה ששלחתי
async function cancelRequest(req, res) {
  await User.updateOne({ _id: req.otherUser._id }, { $pull: { friendRequests: req.me._id } })
  res.json({ status: 'none' })
}

// POST /api/friends/requests/:userId/accept - אישור בקשה שקיבלתי
async function acceptRequest(req, res) {
  if (!req.me.hasFriendRequestFrom(req.otherUser._id)) throw httpError(404, 'הבקשה לא נמצאה')
  await makeFriends(req.me._id, req.otherUser._id)
  res.json({ status: 'friends' })
}

// POST /api/friends/requests/:userId/reject - דחיית בקשה שקיבלתי
async function rejectRequest(req, res) {
  await User.updateOne({ _id: req.me._id }, { $pull: { friendRequests: req.otherUser._id } })
  res.json({ status: 'none' })
}

// DELETE /api/friends/:userId - הסרת חבר (משני הצדדים)
async function removeFriend(req, res) {
  await User.updateOne({ _id: req.me._id }, { $pull: { friends: req.otherUser._id } })
  await User.updateOne({ _id: req.otherUser._id }, { $pull: { friends: req.me._id } })
  res.json({ status: 'none' })
}

module.exports = { myFriends, sendRequest, cancelRequest, acceptRequest, rejectRequest, removeFriend }
