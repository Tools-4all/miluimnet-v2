// Model של משתמש: השדות, בדיקות התקינות, והפעולות שקשורות למשתמש עצמו
// (הצפנת סיסמה, בדיקת סיסמה, ומה מותר להראות לאחרים).
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const httpError = require('../utils/httpError')

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'חובה למלא שם משתמש'],
      unique: true, // אי אפשר שני משתמשים עם אותו שם
      lowercase: true,
      trim: true,
      minlength: [3, 'שם משתמש חייב להכיל לפחות 3 תווים'],
      maxlength: [20, 'שם משתמש יכול להכיל עד 20 תווים'],
      match: [/^[a-z0-9_]+$/, 'שם משתמש יכול להכיל רק אותיות באנגלית, מספרים וקו תחתון'],
    },
    // הסיסמה עצמה לא נשמרת - רק "גיבוב" (hash) שלה, שאי אפשר לשחזר ממנו את הסיסמה.
    // select: false - השדה לא מוחזר בשאילתות, אלא אם מבקשים אותו במפורש
    passwordHash: { type: String, required: true, select: false },
    displayName: {
      type: String,
      required: [true, 'חובה למלא שם מלא'],
      trim: true,
      minlength: [2, 'השם חייב להכיל לפחות 2 תווים'],
      maxlength: [40, 'השם יכול להכיל עד 40 תווים'],
    },
    unit: { type: String, trim: true, maxlength: [60, 'שם היחידה ארוך מדי'], default: '' },
    city: { type: String, trim: true, maxlength: [40, 'שם העיר ארוך מדי'], default: '' },
    bio: { type: String, trim: true, maxlength: [300, 'התיאור יכול להכיל עד 300 תווים'], default: '' },
    // תמונת פרופיל קטנה כטקסט (Base64), אחרי הקטנה עם Canvas בצד הלקוח
    avatar: {
      type: String,
      default: '',
      maxlength: [300000, 'התמונה גדולה מדי'],
    },
    // user = משתמש רגיל, admin = מנהל האתר
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // רשימת החברים - מערך של מזהים של משתמשים אחרים (ref = מצביע למודל User)
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // בקשות חברות שקיבלתי ועוד לא אישרתי
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  // timestamps - Mongoose מוסיף לבד createdAt ו-updatedAt
  { timestamps: true },
)

// ---------- statics: פעולות על המודל כולו (User.something) ----------

// בודק שהסיסמה תקינה ומחזיר את הגיבוב שלה.
// 10 = כמה "סיבובים" של bcrypt. יותר סיבובים = איטי יותר = קשה יותר לפרוץ בניחושים
userSchema.statics.hashPassword = async function (password) {
  if (typeof password !== 'string' || password.length < 6) {
    throw httpError(400, 'הסיסמה חייבת להכיל לפחות 6 תווים')
  }
  if (password.length > 100) throw httpError(400, 'הסיסמה ארוכה מדי')
  return bcrypt.hash(password, 10)
}

// ---------- methods: פעולות על משתמש אחד (user.something) ----------

// משווה סיסמה שהוקלדה לגיבוב השמור (צריך לטעון את המשתמש עם select('+passwordHash'))
userSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

// מה מותר להראות על משתמש לכל אחד (בלי סיסמה, בלי רשימות פרטיות)
userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    unit: this.unit,
    city: this.city,
    bio: this.bio,
    avatar: this.avatar,
    role: this.role,
    createdAt: this.createdAt,
  }
}

// מה המשתמש רואה על עצמו: הפרטים הציבוריים + מונה בקשות החברות שמחכות לו
userSchema.methods.toSelf = function () {
  return { ...this.toPublic(), friendRequestsCount: this.friendRequests.length }
}

module.exports = mongoose.model('User', userSchema)
