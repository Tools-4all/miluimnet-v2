// הכתובות של הצ'אט (השליחה עצמה עוברת ב-Socket.io, ראו server/socket.js)
const express = require('express')
const messages = require('../controllers/messageController')
const { requireLogin } = require('../middleware/auth')
const { loadOtherUser } = require('../middleware/userAccess')

const router = express.Router()
router.use(requireLogin)

// הכתובות הקבועות לפני /:userId, אחרת Express יחשוב ש-"conversations" הוא id
router.get('/conversations', messages.conversations)
router.get('/unread-count', messages.unreadCount)
router.get('/:userId', loadOtherUser, messages.history)

module.exports = router
