// Model של פוסט. פוסט יכול להיות בתוך קבוצה, או פוסט אישי (בלי קבוצה) שרואים החברים.
// סוג הפוסט: regular = פוסט רגיל, sale = מכירת ציוד (עם מחיר)
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // null = פוסט אישי
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    type: { type: String, enum: { values: ['regular', 'sale'], message: 'סוג פוסט לא תקין' }, default: 'regular' },
    text: {
      type: String,
      required: [true, 'אי אפשר לפרסם פוסט ריק'],
      trim: true,
      maxlength: [2000, 'הפוסט יכול להכיל עד 2000 תווים'],
    },
    // מחיר - רק בפוסט מכירה. 0 = למסירה בחינם
    price: {
      type: Number,
      min: [0, 'המחיר לא יכול להיות שלילי'],
      max: [100000, 'המחיר גבוה מדי'],
      // required עם פונקציה: המחיר חובה רק כשהפוסט הוא פוסט מכירה
      required: [
        function () {
          return this.type === 'sale'
        },
        'בפוסט מכירה חובה למלא מחיר',
      ],
    },
    sold: { type: Boolean, default: false },
    // תמונה כטקסט Base64, אחרי עריכה והקטנה ב-Canvas בצד הלקוח
    image: { type: String, default: '', maxlength: [1500000, 'התמונה גדולה מדי'] },
    // קישור לסרטון (mp4/webm) שמנוגן בנגן שבנינו ב-React
    videoUrl: {
      type: String,
      trim: true,
      default: '',
      match: [/^(https?:\/\/\S+)?$/, 'קישור הסרטון חייב להתחיל ב-http:// או https://'],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)

// אינדקסים - מאיצים את השאילתות הנפוצות: הפיד (מהחדש לישן), פוסטים של קבוצה ופוסטים של משתמש
postSchema.index({ createdAt: -1 })
postSchema.index({ group: 1, createdAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })

// ---------- methods: מה מותר לעשות עם פוסט אחד ----------

const idOf = (item) => item._id || item

postSchema.methods.isAuthor = function (userId) {
  return idOf(this.author).equals(userId)
}

// למחוק יכול: מי שכתב, מנהל הקבוצה שהפוסט בתוכה, או מנהל האתר.
// (צריך שהשדה group יעבור populate עם admin)
postSchema.methods.canDelete = function (userId, isSiteAdmin = false) {
  const isGroupAdmin = Boolean(this.group?.admin && idOf(this.group.admin).equals(userId))
  return this.isAuthor(userId) || isGroupAdmin || isSiteAdmin
}

postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((id) => id.equals(userId))
}

module.exports = mongoose.model('Post', postSchema)
