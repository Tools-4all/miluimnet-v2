// הגדרת ה-session - "הזיכרון" של השרת לגבי מי מחובר.
// אחרי התחברות שומרים ב-req.session את ה-id של המשתמש. הדפדפן מקבל cookie עם מזהה ה-session,
// והנתונים עצמם נשמרים ב-MongoDB (באוסף sessions), כך שהם לא נמחקים כשהשרת עולה מחדש.
const session = require('express-session')
const { MongoStore } = require('connect-mongo')

function createSession() {
  const store = MongoStore.create({ mongoUrl: process.env.MONGO_URI })

  const middleware = session({
    secret: process.env.SESSION_SECRET, // מחרוזת סודית שחותמת על ה-cookie, כדי שאי אפשר לזייף אותו
    resave: false,
    saveUninitialized: false, // לא יוצרים session למי שלא התחבר
    store,
    cookie: {
      httpOnly: true, // JavaScript בדפדפן לא יכול לקרוא את ה-cookie - הגנה מפני גניבה שלו
      sameSite: 'lax', // ה-cookie לא נשלח מאתרים אחרים - הגנה מפני זיוף בקשות
      maxAge: 1000 * 60 * 60 * 24 * 7, // שבוע
    },
  })

  return { middleware, store }
}

module.exports = createSession
