// קריאות לשרת שקשורות לצ'אט. השליחה עצמה עוברת ב-Socket.io (ראו hooks/useChat.js)
import { http } from './client.js'

export const getConversations = () => http.get('/messages/conversations')
export const getUnreadCount = () => http.get('/messages/unread-count') // { count }
export const getChatHistory = (userId) => http.get(`/messages/${userId}`) // { user, canChat, messages }
