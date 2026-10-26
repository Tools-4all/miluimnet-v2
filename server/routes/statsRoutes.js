// הכתובת של הסטטיסטיקות (לגרפים בעמוד הסטטיסטיקות)
const express = require('express')
const stats = require('../controllers/statsController')
const { requireLogin } = require('../middleware/auth')

const router = express.Router()
router.use(requireLogin)

router.get('/', stats.getStats)

module.exports = router
