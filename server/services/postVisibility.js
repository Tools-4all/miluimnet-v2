// מי רואה איזה פוסט? הכלל נוגע בשלושה מודלים (משתמש, קבוצה, פוסט), ולכן הוא כתוב כאן, במקום אחד.
// כל שאילתה על פוסטים (פיד, חיפוש, פוסט בודד, לייק) מתחילה מהתנאי הזה - כך אי אפשר "לעקוף"
// אותו דרך חיפוש ולראות פוסט מקבוצה פרטית.
const User = require('../models/User')
const Group = require('../models/Group')
const httpError = require('../utils/httpError')

// אוסף את מה שצריך כדי לדעת מה המשתמש המחובר מורשה לראות
async function getViewer(userId) {
  const me = await User.findById(userId).select('friends role')
  if (!me) throw httpError(401, 'צריך להתחבר')

  const myGroups = await Group.find({ members: me._id }).select('_id')
  const publicGroups = await Group.find({ privacy: 'public' }).select('_id')

  return {
    id: me._id,
    isSiteAdmin: me.role === 'admin',
    friends: me.friends,
    myGroupIds: myGroups.map((g) => g._id),
    // קבוצות שמותר לראות בהן פוסטים: הקבוצות שלי + כל הקבוצות הציבוריות
    visibleGroupIds: [...myGroups, ...publicGroups].map((g) => g._id),
  }
}

// תנאי MongoDB: פוסט מותר לצפייה אם הוא בקבוצה גלויה, או שהוא פוסט אישי שלי או של חבר
function visibilityFilter(viewer) {
  if (viewer.isSiteAdmin) return {}
  return {
    $or: [
      { group: { $in: viewer.visibleGroupIds } },
      { group: null, author: { $in: [...viewer.friends, viewer.id] } },
    ],
  }
}

// הפיד (סעיף 22): הקבוצות שלי והחברים שלי
function feedFilter(viewer) {
  return {
    $or: [
      // כל הפוסטים בקבוצות שאני חבר בהן
      { group: { $in: viewer.myGroupIds } },
      // הפוסטים האישיים שלי ושל החברים שלי
      { group: null, author: { $in: [...viewer.friends, viewer.id] } },
      // פוסטים של חברים בקבוצות ציבוריות (גם אם אני לא חבר בהן)
      { author: { $in: viewer.friends }, group: { $in: viewer.visibleGroupIds } },
    ],
  }
}

module.exports = { getViewer, visibilityFilter, feedFilter }
