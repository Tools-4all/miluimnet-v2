// שכבת services: פעולות שנוגעות בכמה מודלים ביחד.
// מחיקת חשבון צריכה לנקות את המשתמש מכל מקום במערכת - והכל מרוכז כאן, במקום אחד,
// כדי שכשמוסיפים מודל חדש (קבוצות, פוסטים, הודעות) יודעים בדיוק איפה להוסיף את הניקוי.
const User = require('../models/User')

async function deleteUserData(userId) {
  await User.findByIdAndDelete(userId)
  // מוחקים את המשתמש גם מרשימות החברים ובקשות החברות של אחרים
  await User.updateMany({}, { $pull: { friends: userId, friendRequests: userId } })
}

module.exports = { deleteUserData }
