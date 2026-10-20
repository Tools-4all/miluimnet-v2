// Controller של קבוצות: רשימה וחיפוש, יצירה, עריכה, מחיקה, הצטרפות וניהול חברים.
// מציאת הקבוצה ובדיקת הרשאות המנהל נעשות ב-middleware (groupAccess.js), לפני שמגיעים לכאן -
// לכן כאן req.group כבר קיים, והמשתמש כבר מורשה.
const mongoose = require('mongoose')
const Group = require('../models/Group')
const httpError = require('../utils/httpError')
const escapeRegex = require('../utils/escapeRegex')
const { deleteGroupData } = require('../services/groupData')

// השדות שמותר למשתמש לקבוע (לא admin ולא members - את אלה השרת מנהל)
function pickGroupFields(body) {
  const fields = {}
  for (const key of ['name', 'description', 'unitType', 'region', 'privacy']) {
    if (body[key] !== undefined) fields[key] = body[key]
  }
  return fields
}

// ---------- רשימה וחיפוש מתקדם (סעיף 20) ----------

// GET /api/groups?q=&unitType=&region=&minMembers=&mine=true
// aggregation של MongoDB: הנתונים עוברים "צינור" של שלבים בתוך מסד הנתונים
async function listGroups(req, res) {
  const { q, unitType, region, minMembers, mine } = req.query
  const me = new mongoose.Types.ObjectId(req.session.userId)

  // שלב 1: $match - סינון לפי שם, סוג יחידה, אזור, ו"רק הקבוצות שלי"
  const match = {}
  if (q) match.name = new RegExp(escapeRegex(q), 'i')
  if (unitType) match.unitType = String(unitType)
  if (region) match.region = String(region)
  if (mine === 'true') match.members = me

  const pipeline = [
    { $match: match },
    // שלב 2: $addFields - שדות מחושבים: כמה חברים יש, והאם אני חבר
    { $addFields: { memberCount: { $size: '$members' }, isMember: { $in: [me, '$members'] } } },
  ]

  // שלב 3: מספר חברים מינימלי (אפשרי רק אחרי שחישבנו את memberCount)
  if (minMembers !== undefined && minMembers !== '') {
    const min = Number(minMembers)
    if (!Number.isInteger(min) || min < 0) throw httpError(400, 'מספר חברים מינימלי לא תקין')
    pipeline.push({ $match: { memberCount: { $gte: min } } })
  }

  // שלב 4: מיון (הכי גדולות קודם), הגבלת כמות, ובחירת השדות שחוזרים ללקוח
  pipeline.push(
    { $sort: { memberCount: -1, name: 1 } },
    { $limit: 100 },
    { $project: { name: 1, description: 1, unitType: 1, region: 1, privacy: 1, memberCount: 1, isMember: 1, createdAt: 1 } },
  )

  res.json(await Group.aggregate(pipeline))
}

// ---------- קבוצה אחת ----------

// GET /api/groups/:id
async function getGroup(req, res) {
  // populate - מחליף את ה-id של המשתמשים בפרטים שלהם (כמו JOIN בטבלאות)
  const group = await Group.findById(req.params.id)
    .populate('admin', 'username displayName avatar')
    .populate('members', 'username displayName avatar unit')
    .populate('pendingRequests', 'username displayName avatar unit')
  if (!group) throw httpError(404, 'הקבוצה לא נמצאה')

  const me = req.session.userId
  const isAdmin = group.isAdmin(me) || req.session.role === 'admin'
  const canSeeContent = group.canView(me) || isAdmin

  res.json({
    _id: group._id,
    name: group.name,
    description: group.description,
    unitType: group.unitType,
    region: group.region,
    privacy: group.privacy,
    admin: group.admin,
    createdAt: group.createdAt,
    memberCount: group.members.length,
    // בקבוצה פרטית - רק חברים רואים מי חבר בה
    members: canSeeContent ? group.members : [],
    // את הבקשות הממתינות רואה רק המנהל
    pendingRequests: isAdmin ? group.pendingRequests : [],
    isMember: group.isMember(me),
    hasRequested: group.hasRequested(me),
    isAdmin,
    canSeeContent,
  })
}

// POST /api/groups - מי שיוצר את הקבוצה הופך למנהל שלה ולחבר הראשון
async function createGroup(req, res) {
  const group = await Group.create({
    ...pickGroupFields(req.body),
    admin: req.session.userId,
    members: [req.session.userId],
  })
  res.status(201).json(group)
}

// PUT /api/groups/:id - (loadGroup + requireGroupAdmin כבר רצו)
async function updateGroup(req, res) {
  Object.assign(req.group, pickGroupFields(req.body))
  await req.group.save() // save מריץ את בדיקות התקינות של המודל
  res.json(req.group)
}

// DELETE /api/groups/:id - (loadGroup + requireGroupAdmin כבר רצו)
async function deleteGroup(req, res) {
  await deleteGroupData(req.group._id)
  res.json({ ok: true })
}

// ---------- הצטרפות ועזיבה ----------

// POST /api/groups/:id/join - קבוצה ציבורית: מצטרפים מיד. פרטית: נשלחת בקשה למנהל
async function joinGroup(req, res) {
  const me = req.session.userId
  if (req.group.isMember(me)) throw httpError(400, 'כבר חבר בקבוצה')

  // $addToSet - מוסיף למערך רק אם הערך עוד לא קיים בו (מונע כפילויות)
  if (req.group.privacy === 'public') {
    await Group.updateOne({ _id: req.group._id }, { $addToSet: { members: me } })
    return res.json({ status: 'joined' })
  }
  await Group.updateOne({ _id: req.group._id }, { $addToSet: { pendingRequests: me } })
  res.json({ status: 'requested' })
}

// POST /api/groups/:id/leave - עזיבה (או ביטול בקשה שעוד לא אושרה)
async function leaveGroup(req, res) {
  const me = req.session.userId
  if (req.group.isAdmin(me)) throw httpError(400, 'מנהל הקבוצה לא יכול לעזוב. אפשר למחוק את הקבוצה')
  // $pull - מוריד את הערך מהמערך
  await Group.updateOne({ _id: req.group._id }, { $pull: { members: me, pendingRequests: me } })
  res.json({ ok: true })
}

// ---------- ניהול חברים (loadGroup + requireGroupAdmin כבר רצו) ----------

// POST /api/groups/:id/requests/:userId/approve
async function approveRequest(req, res) {
  const { userId } = req.params
  if (!req.group.hasRequested(userId)) throw httpError(404, 'הבקשה לא נמצאה')
  await Group.updateOne({ _id: req.group._id }, { $pull: { pendingRequests: userId }, $addToSet: { members: userId } })
  res.json({ ok: true })
}

// POST /api/groups/:id/requests/:userId/reject
async function rejectRequest(req, res) {
  await Group.updateOne({ _id: req.group._id }, { $pull: { pendingRequests: req.params.userId } })
  res.json({ ok: true })
}

// DELETE /api/groups/:id/members/:userId - המנהל מוציא חבר מהקבוצה
async function removeMember(req, res) {
  if (req.group.isAdmin(req.params.userId)) throw httpError(400, 'אי אפשר להוציא את מנהל הקבוצה')
  await Group.updateOne({ _id: req.group._id }, { $pull: { members: req.params.userId } })
  res.json({ ok: true })
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  approveRequest,
  rejectRequest,
  removeMember,
}
