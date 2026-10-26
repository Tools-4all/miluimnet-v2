// חלון שיחה עם משתמש אחד. הלוגיקה (היסטוריה, הודעות בזמן אמת, שליחה) נמצאת ב-hooks/useChat.js,
// והקומפוננטה רק מציגה את ההודעות ואת טופס השליחה
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '../../hooks/useChat.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSocket } from '../../context/SocketContext.jsx'
import Avatar from '../ui/Avatar.jsx'
import Loading from '../ui/Loading.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const formatTime = (value) => new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

function ChatWindow({ otherId }) {
  const { user } = useAuth()
  const { onlineIds } = useSocket()
  const { other, canChat, messages, error: loadError, send } = useChat(otherId)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // useRef לאזור ההודעות - כדי לגלול לתחתית כשמגיעה הודעה
  const listRef = useRef(null)

  // גלילה לתחתית בכל פעם שהרשימה משתנה (רק בתוך אזור ההודעות, לא כל הדף)
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return
    if (clean.length > 1000) return setError('ההודעה ארוכה מדי')
    setSending(true)
    setError('')
    const result = await send(clean)
    setSending(false)
    if (result.ok) setText('')
    else setError(result.error)
  }

  if (loadError) return <EmptyState text={loadError} />
  if (!other) return <Loading />

  const online = onlineIds.includes(otherId)

  return (
    <div className="panel chat">
      <div className="chat-header">
        <Link to={`/users/${other._id}`} className="member-link">
          <span className="avatar-wrap">
            <Avatar user={other} size={40} />
            {online && <span className="online-dot" />}
          </span>
          <span>
            <strong>{other.displayName}</strong>
            <span className="card-meta"> · {online ? 'מחובר עכשיו' : 'לא מחובר'}</span>
          </span>
        </Link>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="card-meta chat-empty">עוד אין הודעות. כתבו משהו!</p>}
        {messages.map((m) => (
          <div key={m._id} className={m.from === user._id ? 'bubble bubble-mine' : 'bubble'}>
            <p>{m.text}</p>
            <span className="bubble-time">{formatTime(m.createdAt)}</span>
          </div>
        ))}
      </div>

      {canChat ? (
        <form onSubmit={handleSend} className="chat-form">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="כתבו הודעה..." maxLength={1000} />
          <button type="submit" disabled={sending || !text.trim()}>
            שליחה
          </button>
        </form>
      ) : (
        <p className="card-meta chat-locked">אפשר לשלוח הודעות רק לחברים או לחברי קבוצה משותפת.</p>
      )}
      {error && <p className="error chat-error">{error}</p>}
    </div>
  )
}

export default ChatWindow
