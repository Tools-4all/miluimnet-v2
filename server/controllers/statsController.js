// Controller של הסטטיסטיקות (סעיף 29). כל הנתונים מחושבים ב-MongoDB ברגע הבקשה,
// כך שהגרפים תמיד מראים את המצב הנוכחי של מסד הנתונים.
const User = require('../models/User')
const Group = require('../models/Group')
const Post = require('../models/Post')
const Message = require('../models/Message')

const MONTHS = 12
const TIMEZONE = 'Asia/Jerusalem'

// "2026-10" - אותו פורמט ש-MongoDB מחזיר ב-$dateToString
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

// 12 החודשים האחרונים (כולל החודש הנוכחי): תאריך ההתחלה, ורשימת המפתחות לפי הסדר
function lastMonths() {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - (MONTHS - 1))
  const keys = Array.from({ length: MONTHS }, (_, i) => monthKey(new Date(start.getFullYear(), start.getMonth() + i, 1)))
  return { start, keys }
}

// גרף 1 + 2: כמה פוסטים נכתבו בכל חודש, כמה מהם מכירה, וממוצע פוסטים לקבוצה
async function postsPerMonth(groupsCount) {
  const { start, keys } = lastMonths()
  const byMonth = await Post.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      // $group לפי שנה+חודש. $sum: 1 = סופרים מסמכים
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } },
        posts: { $sum: 1 },
        sales: { $sum: { $cond: [{ $eq: ['$type', 'sale'] }, 1, 0] } },
        groupPosts: { $sum: { $cond: [{ $ne: ['$group', null] }, 1, 0] } },
      },
    },
  ])

  // חודשים בלי פוסטים לא מופיעים בתוצאה של MongoDB - משלימים אותם עם 0
  const counts = new Map(byMonth.map((m) => [m._id, m]))
  return keys.map((month) => {
    const m = counts.get(month)
    return {
      month,
      posts: m ? m.posts : 0,
      sales: m ? m.sales : 0,
      // ממוצע פוסטים לקבוצה באותו חודש (הדוגמה מהסעיף בהנחיות), מעוגל לספרה אחת אחרי הנקודה
      avgPerGroup: m && groupsCount ? Math.round((m.groupPosts / groupsCount) * 10) / 10 : 0,
    }
  })
}

// גרף 3: הקבוצות הכי פעילות - מספר הפוסטים בכל קבוצה
function topGroups() {
  return Post.aggregate([
    { $match: { group: { $ne: null } } },
    { $group: { _id: '$group', posts: { $sum: 1 } } },
    { $sort: { posts: -1 } },
    { $limit: 8 },
    // $lookup - מביא את שם הקבוצה ומספר החברים מאוסף groups (כמו populate, בתוך aggregation)
    { $lookup: { from: 'groups', localField: '_id', foreignField: '_id', as: 'group' } },
    { $unwind: '$group' },
    { $project: { _id: 1, posts: 1, name: '$group.name', members: { $size: '$group.members' } } },
  ])
}

// GET /api/stats
async function getStats(req, res) {
  const groups = await Group.countDocuments()
  const [users, posts, sales, messages, months, top] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Post.countDocuments({ type: 'sale' }),
    Message.countDocuments(),
    postsPerMonth(groups),
    topGroups(),
  ])
  res.json({ totals: { users, groups, posts, sales, messages }, postsPerMonth: months, topGroups: top })
}

module.exports = { getStats }
