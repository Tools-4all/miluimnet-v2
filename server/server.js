// נקודת הכניסה של השרת: טוען הגדרות ומתחיל להאזין
require('dotenv').config({ quiet: true })
const http = require('http')
const app = require('./app')

const PORT = process.env.PORT || 3000

// שרת http רגיל שעוטף את Express - נצטרך אותו בהמשך גם ל-Socket.io (הצ'אט)
const server = http.createServer(app)

// שגיאה בהפעלת השרת - למשל הפורט כבר תפוס על ידי תוכנה אחרת
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`הפורט ${PORT} כבר תפוס. סגרו את השרת השני או שנו את PORT בקובץ .env`)
  } else {
    console.error('השרת לא הצליח לעלות:', err.message)
  }
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`השרת רץ בכתובת http://localhost:${PORT}`)
})
