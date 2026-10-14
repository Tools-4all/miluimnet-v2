// חיבור למסד הנתונים MongoDB בעזרת Mongoose
const mongoose = require('mongoose')

async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('חסר MONGO_URI בקובץ .env - ראו .env.example')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('מחובר ל-MongoDB:', mongoose.connection.name)
}

module.exports = connectDB
