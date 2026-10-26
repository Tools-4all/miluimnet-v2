// הכתובות של החברים. loadOtherUser בודק את המשתמש השני לפני כל פעולה עליו
const express = require('express')
const friends = require('../controllers/friendController')
const { requireLogin } = require('../middleware/auth')
const { loadOtherUser } = require('../middleware/userAccess')

const router = express.Router()
router.use(requireLogin)

router.get('/', friends.myFriends)
router.post('/requests/:userId', loadOtherUser, friends.sendRequest)
router.delete('/requests/:userId', loadOtherUser, friends.cancelRequest)
router.post('/requests/:userId/accept', loadOtherUser, friends.acceptRequest)
router.post('/requests/:userId/reject', loadOtherUser, friends.rejectRequest)
router.delete('/:userId', loadOtherUser, friends.removeFriend)

module.exports = router
