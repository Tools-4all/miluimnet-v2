// Model של קבוצה - למשל קבוצה של גדוד, פלוגה או צוות
const mongoose = require('mongoose')
const { UNIT_TYPES, REGIONS } = require('../config/constants')

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'חובה למלא שם לקבוצה'],
      unique: true,
      trim: true,
      minlength: [3, 'שם הקבוצה חייב להכיל לפחות 3 תווים'],
      maxlength: [50, 'שם הקבוצה יכול להכיל עד 50 תווים'],
    },
    description: { type: String, trim: true, maxlength: [1000, 'התיאור ארוך מדי'], default: '' },
    // enum - הערך חייב להיות אחד מהרשימה
    unitType: {
      type: String,
      enum: { values: UNIT_TYPES, message: 'סוג יחידה לא תקין' },
      required: [true, 'חובה לבחור סוג יחידה'],
    },
    region: {
      type: String,
      enum: { values: REGIONS, message: 'אזור לא תקין' },
      required: [true, 'חובה לבחור אזור'],
    },
    // public = כל אחד מצטרף מיד. private = צריך אישור של מנהל הקבוצה, ורק חברים רואים את התוכן
    privacy: {
      type: String,
      enum: { values: ['public', 'private'], message: 'סוג פרטיות לא תקין' },
      default: 'public',
    },
    // מנהל הקבוצה - מי שיצר אותה
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // משתמשים שביקשו להצטרף לקבוצה פרטית ומחכים לאישור
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)

// ---------- methods: שאלות על קבוצה אחת ----------
// (עובדות גם כשהשדות עברו populate - אז כל איבר הוא אובייקט עם _id)

const idOf = (item) => item._id || item

groupSchema.methods.isMember = function (userId) {
  return this.members.some((m) => idOf(m).equals(userId))
}

groupSchema.methods.hasRequested = function (userId) {
  return this.pendingRequests.some((u) => idOf(u).equals(userId))
}

groupSchema.methods.isAdmin = function (userId) {
  return idOf(this.admin).equals(userId)
}

// בקבוצה ציבורית כל אחד רואה את התוכן. בפרטית - רק החברים
groupSchema.methods.canView = function (userId) {
  return this.privacy === 'public' || this.isMember(userId)
}

module.exports = mongoose.model('Group', groupSchema)
