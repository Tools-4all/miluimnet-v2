// הודעה קופצת קטנה בפינת המסך ("toast"), בעזרת jQuery.
// שימוש: notify('נשמר!')  או  notify('משהו השתבש', 'error')
import $ from 'jquery'

export function notify(message, type = 'success') {
  // יוצרים אלמנט חדש עם jQuery, מוסיפים לו מחלקות וטקסט, ומצרפים לגוף הדף
  const $toast = $('<div>').addClass(`toast toast-${type}`).text(message).hide()
  $('body').append($toast)

  // אנימציות של jQuery: מופיע בהדרגה, מחכה 2.5 שניות, נעלם בהדרגה ונמחק
  $toast
    .fadeIn(200)
    .delay(2500)
    .fadeOut(400, () => $toast.remove())
}
