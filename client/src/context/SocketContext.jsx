// חיבור אחד ל-Socket.io לכל האפליקציה, שמשותף לכל הקומפוננטות דרך Context.
// מחזיק גם: מי מחובר עכשיו (onlineIds), וכמה הודעות לא נקראו (unreadCount - למונה בתפריט)
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { getUnreadCount } from '../api/messages.js'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineIds, setOnlineIds] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(() => {
    getUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {}) // המונה לא קריטי - אם נכשל, פשוט לא מתעדכן
  }, [])

  // מתחברים כשיש משתמש מחובר, ומתנתקים כשהוא יוצא
  const userId = user?._id
  useEffect(() => {
    if (!userId) return
    // io() בלי כתובת - מתחבר לאותו שרת שממנו נטען האתר, עם ה-cookie של ההתחברות
    const s = io()
    s.on('connect', () => {
      setSocket(s)
      refreshUnread()
    })
    s.on('presence', setOnlineIds)
    // הגיעה הודעה חדשה - מעדכנים את המונה (חלון השיחה עצמו מסמן כנקרא אם היא פתוחה)
    s.on('message:new', refreshUnread)

    // ניקוי: כשהמשתמש מתנתק או הקומפוננטה נעלמת - סוגרים את החיבור ומאפסים
    return () => {
      s.disconnect()
      setSocket(null)
      setOnlineIds([])
      setUnreadCount(0)
    }
  }, [userId, refreshUnread])

  return (
    <SocketContext.Provider value={{ socket, onlineIds, unreadCount, refreshUnread }}>{children}</SocketContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  return useContext(SocketContext)
}
