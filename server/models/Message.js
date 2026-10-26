// Model של הודעה בצ'אט פרטי בין שני משתמשים
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
      type: String,
      required: [true, 'אי אפשר לשלוח הודעה ריקה'],
      trim: true,
      maxlength: [1000, 'ההודעה ארוכה מדי (עד 1000 תווים)'],
    },
    // האם מי שקיבל את ההודעה כבר קרא אותה
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

// אינדקסים - מאיצים את "כל ההודעות בין שני משתמשים, לפי זמן" ואת ספירת ההודעות שלא נקראו
messageSchema.index({ from: 1, to: 1, createdAt: -1 })
messageSchema.index({ to: 1, read: 1 })

module.exports = mongoose.model('Message', messageSchema)
