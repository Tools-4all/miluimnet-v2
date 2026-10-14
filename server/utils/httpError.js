// יוצר שגיאה עם קוד סטטוס HTTP.
// שימוש ב-controller:  throw httpError(403, 'אין לך הרשאה')
// ה-errorHandler יחזיר ללקוח את הקוד וההודעה.
function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

module.exports = httpError
