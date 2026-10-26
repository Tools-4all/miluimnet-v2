// Controller של פוסטים: פיד, חיפוש מתקדם, יצירה, עריכה, מחיקה ולייקים.
// מציאת הפוסט ובדיקת ההרשאות לפוסט קיים נעשות ב-middleware (postAccess.js).
// מי רואה איזה פוסט - כתוב ב-services/postVisibility.js
const mongoose = require('mongoose')
const Post = require('../models/Post')
const Group = require('../models/Group')
const httpError = require('../utils/httpError')
const escapeRegex = require('../utils/escapeRegex')
const { getViewer, visibilityFilter, feedFilter } = require('../services/postVisibility')

const PAGE_SIZE = 30

// מה שהלקוח מקבל על כל פוסט: הפוסט עצמו, מספר לייקים, ומה מותר למשתמש לעשות איתו
function toClient(post, viewer) {
  return {
    _id: post._id,
    author: post.author,
    group: post.group ? { _id: post.group._id, name: post.group.name } : null,
    type: post.type,
    text: post.text,
    price: post.price,
    sold: post.sold,
    image: post.image,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likesCount: post.likes.length,
    liked: post.isLikedBy(viewer.id),
    canEdit: post.isAuthor(viewer.id),
    canDelete: post.canDelete(viewer.id, viewer.isSiteAdmin),
  }
}

// שאילתה + populate (פרטי הכותב ושם הקבוצה) + מיון מהחדש לישן + עמודים
function findPosts(filter, page) {
  return Post.find(filter)
    .populate('author', 'username displayName avatar')
    .populate('group', 'name admin')
    .sort({ createdAt: -1 })
    .skip(page * PAGE_SIZE)
    .limit(PAGE_SIZE)
}

// ---------- בדיקת פרמטרים מהכתובת ----------

function parsePage(value) {
  const page = Number(value || 0)
  if (!Number.isInteger(page) || page < 0) throw httpError(400, 'מספר עמוד לא תקין')
  return page
}

function parseId(value, message) {
  if (!mongoose.isValidObjectId(value)) throw httpError(400, message)
  return value
}

function parseDate(value, message) {
  const date = new Date(value)
  if (isNaN(date)) throw httpError(400, message)
  return date
}

function parsePrice(value, message) {
  const n = Number(value)
  if (isNaN(n) || n < 0) throw httpError(400, message)
  return n
}

const hasValue = (value) => value !== undefined && value !== ''

// ---------- פיד (סעיף 22) ----------

// GET /api/posts/feed?page= - פוסטים מהקבוצות שלי ומהחברים שלי
async function feed(req, res) {
  const viewer = await getViewer(req.session.userId)
  const posts = await findPosts(feedFilter(viewer), parsePage(req.query.page))
  res.json(posts.map((p) => toClient(p, viewer)))
}

// ---------- חיפוש מתקדם (סעיף 20) ----------

// GET /api/posts?q=&type=&from=&to=&minPrice=&maxPrice=&group=&author=
// משמש גם לפוסטים של עמוד קבוצה (?group=) ושל עמוד פרופיל (?author=)
async function listPosts(req, res) {
  const viewer = await getViewer(req.session.userId)
  const { q, group, author, type, from, to, minPrice, maxPrice } = req.query

  // תמיד מתחילים מתנאי הצפייה - כדי שחיפוש לא יחשוף פוסטים מקבוצות פרטיות
  const conditions = [visibilityFilter(viewer)]

  if (q) conditions.push({ text: new RegExp(escapeRegex(q), 'i') })
  if (group) conditions.push({ group: parseId(group, 'מזהה קבוצה לא תקין') })
  if (author) conditions.push({ author: parseId(author, 'מזהה משתמש לא תקין') })
  if (type) {
    if (!['regular', 'sale'].includes(type)) throw httpError(400, 'סוג פוסט לא תקין')
    conditions.push({ type })
  }

  // טווח תאריכים: $gte = גדול או שווה, $lte = קטן או שווה
  if (from || to) {
    const range = {}
    if (from) range.$gte = parseDate(from, 'תאריך התחלה לא תקין')
    if (to) {
      range.$lte = parseDate(to, 'תאריך סיום לא תקין')
      range.$lte.setHours(23, 59, 59, 999) // עד סוף היום
    }
    if (range.$gte && range.$lte && range.$gte > range.$lte) throw httpError(400, 'תאריך ההתחלה אחרי תאריך הסיום')
    conditions.push({ createdAt: range })
  }

  // טווח מחירים (רלוונטי לפוסטים של מכירה)
  if (hasValue(minPrice) || hasValue(maxPrice)) {
    const range = {}
    if (hasValue(minPrice)) range.$gte = parsePrice(minPrice, 'מחיר מינימום לא תקין')
    if (hasValue(maxPrice)) range.$lte = parsePrice(maxPrice, 'מחיר מקסימום לא תקין')
    if (range.$gte > range.$lte) throw httpError(400, 'מחיר המינימום גבוה ממחיר המקסימום')
    conditions.push({ price: range })
  }

  // $and - כל התנאים צריכים להתקיים יחד
  const posts = await findPosts({ $and: conditions }, parsePage(req.query.page))
  res.json(posts.map((p) => toClient(p, viewer)))
}

// GET /api/posts/:id (הפוסט כבר נטען ב-loadPost)
function getPost(req, res) {
  res.json(toClient(req.post, req.viewer))
}

// ---------- יצירה, עריכה, מחיקה ----------

// השדות שהמשתמש יכול לקבוע (לא author, group או likes - את אלה השרת מנהל)
function pickPostFields(body) {
  const fields = {}
  for (const key of ['text', 'type', 'price', 'image', 'videoUrl', 'sold']) {
    if (body[key] !== undefined) fields[key] = body[key]
  }
  // בפוסט רגיל אין מחיר ואין "נמכר"
  if (fields.type === 'regular') {
    fields.price = undefined
    fields.sold = false
  }
  return fields
}

// POST /api/posts - פוסט אישי, או פוסט בקבוצה (body.group)
async function createPost(req, res) {
  const viewer = await getViewer(req.session.userId)

  // פוסט בקבוצה - רק חברי הקבוצה יכולים לפרסם בה
  let groupId = null
  if (req.body.group) {
    const group = await Group.findById(parseId(req.body.group, 'מזהה קבוצה לא תקין'))
    if (!group) throw httpError(404, 'הקבוצה לא נמצאה')
    if (!group.isMember(viewer.id)) throw httpError(403, 'רק חברי הקבוצה יכולים לפרסם בה')
    groupId = group._id
  }

  const post = await Post.create({ ...pickPostFields(req.body), author: viewer.id, group: groupId })
  await post.populate([
    { path: 'author', select: 'username displayName avatar' },
    { path: 'group', select: 'name admin' },
  ])
  res.status(201).json(toClient(post, viewer))
}

// PUT /api/posts/:id - רק מי שכתב (requirePostAuthor)
async function updatePost(req, res) {
  Object.assign(req.post, pickPostFields(req.body))
  await req.post.save() // save מריץ את בדיקות התקינות (למשל מחיר בפוסט מכירה)
  res.json(toClient(req.post, req.viewer))
}

// DELETE /api/posts/:id - הכותב, מנהל הקבוצה או מנהל האתר (requirePostDeleter)
async function deletePost(req, res) {
  await req.post.deleteOne()
  res.json({ ok: true })
}

// POST /api/posts/:id/like - לייק, ולחיצה נוספת מבטלת אותו
async function toggleLike(req, res) {
  const { post, viewer } = req
  const liked = post.isLikedBy(viewer.id)
  // $addToSet / $pull - עדכון אטומי במסד, כך ששתי לחיצות במקביל לא דורסות זו את זו
  const updated = await Post.findByIdAndUpdate(
    post._id,
    liked ? { $pull: { likes: viewer.id } } : { $addToSet: { likes: viewer.id } },
    { returnDocument: 'after' }, // מחזיר את הפוסט אחרי העדכון
  )
  res.json({ liked: !liked, likesCount: updated.likes.length })
}

module.exports = { feed, listPosts, getPost, createPost, updatePost, deletePost, toggleLike }
