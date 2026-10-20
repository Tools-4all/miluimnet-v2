// חיבור למסד הנתונים MongoDB בעזרת Mongoose
const mongoose = require('mongoose')

// מוודא שכל האינדקסים של המודלים קיימים (למשל unique על שם משתמש).
// בלי זה Mongoose בונה אותם ברקע, ובקשות שמגיעות מיד אחרי העלייה עלולות לעקוף את הבדיקה
async function ensureIndexes() {
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
}

async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    console.error('חסר MONGO_URI בקובץ .env - ראו .env.example')
    process.exit(1)
  }

  await mongoose.connect(uri)
  await ensureIndexes()
  console.log('מחובר ל-MongoDB:', mongoose.connection.name)
}

module.exports = connectDB
module.exports.ensureIndexes = ensureIndexes
