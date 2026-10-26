// שכבת services: פעולות שנוגעות בכמה מודלים ביחד.
// מחיקת חשבון צריכה לנקות את המשתמש מכל מקום במערכת - והכל מרוכז כאן, במקום אחד,
// כדי שכשמוסיפים מודל חדש (קבוצות, פוסטים, הודעות) יודעים בדיוק איפה להוסיף את הניקוי.
const User = require('../models/User')
const Group = require('../models/Group')
const Post = require('../models/Post')
const { deleteGroupData } = require('./groupData')

async function deleteUserData(userId) {
  await User.findByIdAndDelete(userId)
  // מוחקים את המשתמש גם מרשימות החברים ובקשות החברות של אחרים
  await User.updateMany({}, { $pull: { friends: userId, friendRequests: userId } })
  // קבוצות שהוא ניהל נמחקות, ומשאר הקבוצות הוא יוצא
  const adminGroups = await Group.find({ admin: userId }).select('_id')
  await deleteGroupData(adminGroups.map((g) => g._id))
  await Group.updateMany({}, { $pull: { members: userId, pendingRequests: userId } })
  // הפוסטים שלו נמחקים, והלייקים שלו יורדים מפוסטים של אחרים
  await Post.deleteMany({ author: userId })
  await Post.updateMany({ likes: userId }, { $pull: { likes: userId } })
}

module.exports = { deleteUserData }
