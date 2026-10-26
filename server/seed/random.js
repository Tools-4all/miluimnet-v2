// "אקראיות" שחוזרת על עצמה: מחולל עם נקודת התחלה קבועה (seed), כך שבכל הרצה מתקבלים אותם נתונים בדיוק.
// (Math.random היה נותן נתונים אחרים בכל הרצה - קשה לבדוק ולהראות)
let state = 20261014

// מספר בין 0 ל-1 (Linear Congruential Generator - נוסחה פשוטה וידועה)
function random() {
  state = (state * 1664525 + 1013904223) % 4294967296
  return state / 4294967296
}

const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min
const pick = (list) => list[Math.floor(random() * list.length)]

// בוחר n פריטים שונים מתוך רשימה
function pickMany(list, n) {
  const copy = [...list]
  const result = []
  while (result.length < n && copy.length > 0) result.push(copy.splice(Math.floor(random() * copy.length), 1)[0])
  return result
}

const DAY = 24 * 60 * 60 * 1000
// תאריך לפני X ימים (עם שעה אקראית ביום)
const daysAgo = (days) => new Date(Date.now() - days * DAY - randInt(0, 12 * 60) * 60 * 1000)

module.exports = { random, randInt, pick, pickMany, daysAgo }
