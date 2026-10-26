// עיצוב טקסטים קטנים שחוזרים בכמה מקומות באתר

// "חבר אחד" / "5 חברים" - בעברית אומרים "חבר אחד" ולא "1 חברים"
export function formatMembers(count) {
  return count === 1 ? 'חבר אחד' : `${count} חברים`
}

// תאריך ושעה בפורמט ישראלי: 14.10.2026, 18:30
export function formatDate(value) {
  return new Date(value).toLocaleString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// מחיר: 0 = למסירה בחינם
export function formatPrice(price) {
  return price === 0 ? 'למסירה' : `${price} ₪`
}

// "תוצאה אחת" / "12 תוצאות"
export function formatResults(count) {
  return count === 1 ? 'תוצאה אחת' : `${count} תוצאות`
}
