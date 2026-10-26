// עמוד ההודעות: רשימת השיחות בצד, והשיחה הפתוחה (לפי /messages/:userId)
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getConversations } from '../api/messages.js'
import { useFetch } from '../hooks/useFetch.js'
import { useSocket } from '../context/SocketContext.jsx'
import ConversationList from '../components/chat/ConversationList.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function Messages() {
  const { userId } = useParams()
  const { socket } = useSocket()
  // נטען מחדש גם כשפותחים שיחה אחרת - כדי שהמונה שלה יתאפס
  const { data: conversations, reload } = useFetch(getConversations, [userId])

  // כל הודעה חדשה (גם בשיחה אחרת) - מעדכנים את הרשימה
  useEffect(() => {
    if (!socket) return
    socket.on('message:new', reload)
    return () => socket.off('message:new', reload)
  }, [socket, reload])

  return (
    <div>
      <div className="page-header">
        <h1>הודעות</h1>
        <p>שיחות פרטיות עם חברים ועם חברי הקבוצות שלך.</p>
      </div>

      <div className="messages-layout">
        <aside className="panel conversation-list">
          {conversations ? <ConversationList conversations={conversations} activeId={userId} /> : <Loading />}
        </aside>
        <section>
          {/* key - שיחה אחרת = חלון חדש, בלי שאריות מהשיחה הקודמת (טקסט שהוקלד, שגיאות) */}
          {userId ? <ChatWindow key={userId} otherId={userId} /> : <EmptyState text="בחרו שיחה מהרשימה." />}
        </section>
      </div>
    </div>
  )
}

export default Messages
