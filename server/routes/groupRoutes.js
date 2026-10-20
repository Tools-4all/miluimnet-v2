// הכתובות של הקבוצות. כאן רואים בבירור איזה middleware רץ לפני כל פעולה:
//   loadGroup         - מוצא את הקבוצה (או 404)
//   requireGroupAdmin - רק מנהל הקבוצה ממשיך (או 403)
const express = require('express')
const groups = require('../controllers/groupController')
const { requireLogin } = require('../middleware/auth')
const { loadGroup, requireGroupAdmin } = require('../middleware/groupAccess')

const router = express.Router()
router.use(requireLogin) // כל הכתובות כאן דורשות התחברות

router.get('/', groups.listGroups)
router.post('/', groups.createGroup)
router.get('/:id', groups.getGroup)
router.put('/:id', loadGroup, requireGroupAdmin, groups.updateGroup)
router.delete('/:id', loadGroup, requireGroupAdmin, groups.deleteGroup)

router.post('/:id/join', loadGroup, groups.joinGroup)
router.post('/:id/leave', loadGroup, groups.leaveGroup)
router.post('/:id/requests/:userId/approve', loadGroup, requireGroupAdmin, groups.approveRequest)
router.post('/:id/requests/:userId/reject', loadGroup, requireGroupAdmin, groups.rejectRequest)
router.delete('/:id/members/:userId', loadGroup, requireGroupAdmin, groups.removeMember)

module.exports = router
