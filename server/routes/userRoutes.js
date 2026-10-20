// הכתובות של המשתמשים. requireLogin רץ לפני כל ה-controllers ובודק שיש משתמש מחובר
const express = require('express')
const users = require('../controllers/userController')
const { requireLogin } = require('../middleware/auth')

const router = express.Router()
router.use(requireLogin)

router.get('/', users.listUsers)
// /me חייב להופיע לפני /:id, אחרת Express יחשוב ש-"me" הוא id
router.put('/me', users.updateMe)
router.delete('/me', users.deleteMe)
router.get('/:id', users.getUser)

module.exports = router
