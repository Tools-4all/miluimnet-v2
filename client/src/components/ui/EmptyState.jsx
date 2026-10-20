// הודעה כשאין מה להציג (רשימה ריקה, לא נמצא, שגיאה)
// children - אפשר להוסיף מתחת לטקסט קישור או כפתור
function EmptyState({ text, children }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {children}
    </div>
  )
}

export default EmptyState
