// הבסיס של כל הקריאות לשרת - בעזרת $.ajax של jQuery (סעיף 25).
// הקבצים האחרים בתיקייה (auth.js, users.js...) משתמשים בפונקציות מכאן,
// וכך כל הכתובות של השרת כתובות רק בתיקיית api, ולא מפוזרות בעמודים.
import $ from 'jquery'

function request(method, url, data) {
  // מחזירים Promise - כך בקומפוננטות אפשר לכתוב: const users = await getUsers()
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/api' + url,
      method,
      // ב-GET הנתונים נשלחים כפרמטרים בכתובת (?q=...), בשאר כגוף JSON
      data: method === 'GET' ? data : JSON.stringify(data ?? {}),
      contentType: 'application/json',
      dataType: 'json',
      success: resolve,
      error: (xhr) => {
        // השרת מחזיר { error: '...' } - מעבירים את ההודעה הלאה לקומפוננטה
        const message = xhr.responseJSON?.error || 'אין חיבור לשרת'
        reject(new Error(message))
      },
    })
  })
}

export const http = {
  get: (url, params) => request('GET', url, params),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  delete: (url) => request('DELETE', url),
}
