// צ'אט בזמן אמת עם Socket.io (סעיף 28).
// HTTP רגיל: הלקוח שואל והשרת עונה. WebSocket: חיבור שנשאר פתוח,
// והשרת יכול "לדחוף" הודעה ללקוח ברגע שהיא מגיעה - בלי שהלקוח ישאל.
const { Server } = require('socket.io')
const { saveMessage, markRead } = require('./services/chat')
const errorResponse = require('./utils/errorResponse')

function setupSocket(httpServer, sessionMiddleware) {
  const io = new Server(httpServer)

  // כמה חיבורים פתוחים יש לכל משתמש (אפשר כמה לשוניות) - כדי לדעת מי מחובר עכשיו
  const onlineCounts = new Map()
  const broadcastPresence = () => io.emit('presence', [...onlineCounts.keys()])

  // משתמשים באותו session של Express: כך יודעים מי המשתמש שמתחבר לצ'אט
  io.engine.use(sessionMiddleware)

  io.on('connection', (socket) => {
    const userId = socket.request.session?.userId
    // מי שלא מחובר לאתר - מנותק מהצ'אט מיד
    if (!userId) return socket.disconnect(true)

    // "חדר" פרטי לכל משתמש: שולחים לחדר, וכל הלשוניות שלו מקבלות
    socket.join(`user:${userId}`)
    onlineCounts.set(userId, (onlineCounts.get(userId) || 0) + 1)
    broadcastPresence()

    // שליחת הודעה. ack = פונקציה שמחזירה תשובה לשולח (הצלחה או שגיאה)
    socket.on('message:send', async ({ to, text } = {}, ack = () => {}) => {
      try {
        const message = await saveMessage(userId, to, text)
        // ההודעה נשלחת לנמען ולשולח (כדי שתופיע גם בלשוניות האחרות שלו)
        io.to(`user:${to}`).to(`user:${userId}`).emit('message:new', message)
        ack({ ok: true, message })
      } catch (err) {
        // שגיאה לא מפילה את השרת - חוזרת לשולח כהודעה, בדיוק כמו ב-API
        ack({ ok: false, error: errorResponse(err).error })
      }
    })

    // הנמען פתח את השיחה - מסמנים את ההודעות שקיבל ממנו כנקראו.
    // ack - הלקוח יודע מתי הסימון הסתיים, ורק אז מעדכן את המונה בתפריט
    socket.on('message:read', async ({ from } = {}, ack = () => {}) => {
      try {
        await markRead(from, userId)
      } catch (err) {
        errorResponse(err) // נרשם בטרמינל, והחיבור ממשיך
      }
      ack()
    })

    socket.on('disconnect', () => {
      const count = (onlineCounts.get(userId) || 1) - 1
      if (count <= 0) onlineCounts.delete(userId)
      else onlineCounts.set(userId, count)
      broadcastPresence()
    })
  })

  return io
}

module.exports = setupSocket
