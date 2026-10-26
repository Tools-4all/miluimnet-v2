// כפתור חברות בעמוד פרופיל. מציג פעולה אחרת לפי הקשר ביני לבין המשתמש:
// none = הוספה, outgoing = ביטול הבקשה, incoming = אישור, friends = הסרה
import {
  acceptFriendRequest,
  cancelFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../../api/friends.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { notify } from '../../utils/notify.js'

// לכל מצב: איזו פעולה, מה כתוב על הכפתור, ואיזו הודעה מוצגת אחרי
const ACTIONS = {
  none: { request: sendFriendRequest, label: '+ הוספת חבר', done: 'בקשת החברות נשלחה' },
  outgoing: { request: cancelFriendRequest, label: 'הבקשה נשלחה · ביטול', done: 'הבקשה בוטלה', secondary: true },
  incoming: { request: acceptFriendRequest, label: 'אישור בקשת החברות', done: 'אתם חברים עכשיו' },
  friends: { request: removeFriend, label: '✓ חברים · הסרה', done: 'החבר הוסר', secondary: true },
}

// onChange(status) - נקרא עם הקשר החדש שהשרת החזיר
function FriendButton({ userId, status, onChange }) {
  const { refreshUser } = useAuth()
  const action = ACTIONS[status]
  if (!action) return null // status === 'self'

  async function handleClick() {
    try {
      const result = await action.request(userId)
      notify(action.done)
      onChange(result.status)
      refreshUser() // מונה בקשות החברות בתפריט
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <button className={action.secondary ? 'button-secondary' : undefined} onClick={handleClick}>
      {action.label}
    </button>
  )
}

export default FriendButton
