// GET /api/meta - רשימות קבועות לצד הלקוח (סוגי יחידות ואזורים).
// כך הרשימות כתובות רק במקום אחד (server/config/constants.js), ולא מועתקות ללקוח
const express = require('express')
const { UNIT_TYPES, REGIONS } = require('../config/constants')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ unitTypes: UNIT_TYPES, regions: REGIONS })
})

module.exports = router
