// שיחה עם משתמש אחד: ההיסטוריה מהשרת (HTTP), והודעות חדשות בזמן אמת (Socket.io).
//   const { other, canChat, messages, error, send } = useChat(otherId)
import { useEffect } from 'react'
import { getChatHistory } from '../api/messages.js'
import { useFetch } from './useFetch.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

export function useChat(otherId) {
  const { user } = useAuth()
  const { socket, refreshUnread } = useSocket()

  // ההיסטוריה. השרת גם מסמן את ההודעות כנקראו - אז מעדכנים את המונה בתפריט
  const { data, error, setData } = useFetch(async () => {
    const history = await getChatHistory(otherId)
    refreshUnread()
    return history
  }, [otherId])

  // האזנה להודעות חדשות בזמן אמת
  useEffect(() => {
    if (!socket) return
    function handleNew(message) {
      // רק הודעות של השיחה הזו (ממני אליו, או ממנו אליי)
      const mine = message.from === user._id && message.to === otherId
      const theirs = message.from === otherId && message.to === user._id
      if (!mine && !theirs) return

      // setData עם פונקציה - הרשימה העדכנית ביותר, ובלי להוסיף את אותה הודעה פעמיים
      setData((current) =>
        !current || current.messages.some((m) => m._id === message._id)
          ? current
          : { ...current, messages: [...current.messages, message] },
      )
      // הודעה מהצד השני כשהשיחה פתוחה - כבר קראנו אותה
      if (theirs) socket.emit('message:read', { from: otherId }, refreshUnread)
    }
    socket.on('message:new', handleNew)
    // ניקוי - מסירים את המאזין כשעוברים לשיחה אחרת
    return () => socket.off('message:new', handleNew)
  }, [socket, otherId, user._id, refreshUnread, setData])

  // שליחה: emit עם פונקציית תשובה (ack) - השרת מחזיר { ok } או { ok: false, error }
  function send(text) {
    if (!socket) return Promise.resolve({ ok: false, error: 'אין חיבור לצ\'אט, נסו לרענן את הדף' })
    return new Promise((resolve) => socket.emit('message:send', { to: otherId, text }, resolve))
  }

  return {
    other: data?.user,
    canChat: Boolean(data?.canChat),
    messages: data?.messages || [],
    error,
    send,
  }
}
