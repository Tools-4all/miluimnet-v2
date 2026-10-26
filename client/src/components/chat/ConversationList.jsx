// רשימת השיחות שלי בצד עמוד ההודעות: עם מי, ההודעה האחרונה, ומונה הודעות שלא נקראו
import { Link } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import Avatar from '../ui/Avatar.jsx'

function ConversationList({ conversations, activeId }) {
  const { onlineIds } = useSocket()

  if (conversations.length === 0) {
    return <p className="card-meta">עוד אין שיחות. אפשר לשלוח הודעה מהפרופיל של חבר.</p>
  }

  return conversations.map((c) => (
    <Link key={c.user._id} to={`/messages/${c.user._id}`} className={c.user._id === activeId ? 'conversation active' : 'conversation'}>
      <span className="avatar-wrap">
        <Avatar user={c.user} size={40} />
        {onlineIds.includes(c.user._id) && <span className="online-dot" />}
      </span>
      <span className="conversation-text">
        <strong>{c.user.displayName}</strong>
        <span className="card-meta conversation-last">
          {c.lastFromMe && 'אני: '}
          {c.lastText}
        </span>
      </span>
      {/* בשיחה הפתוחה ההודעות כבר נקראו, אז לא מציגים מונה */}
      {c.unread > 0 && c.user._id !== activeId && <span className="badge-count">{c.unread}</span>}
    </Link>
  ))
}

export default ConversationList
