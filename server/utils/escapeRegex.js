// מונע מתווים מיוחדים בחיפוש (כמו * או .) לשבור את ה-RegExp.
// למשל חיפוש "a.b" יחפש בדיוק "a.b", ולא "a, תו כלשהו, b"
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = escapeRegex
