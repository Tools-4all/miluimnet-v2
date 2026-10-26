// הכתובות של הפוסטים. כאן רואים איזה middleware רץ לפני כל פעולה:
//   loadPost           - מוצא את הפוסט רק אם מותר לראות אותו (או 404)
//   requirePostAuthor  - רק מי שכתב (או 403)
//   requirePostDeleter - הכותב, מנהל הקבוצה או מנהל האתר (או 403)
const express = require('express')
const posts = require('../controllers/postController')
const { requireLogin } = require('../middleware/auth')
const { loadPost, requirePostAuthor, requirePostDeleter } = require('../middleware/postAccess')

const router = express.Router()
router.use(requireLogin)

// /feed חייב להופיע לפני /:id, אחרת Express יחשוב ש-"feed" הוא id
router.get('/feed', posts.feed)
router.get('/', posts.listPosts)
router.post('/', posts.createPost)
router.get('/:id', loadPost, posts.getPost)
router.put('/:id', loadPost, requirePostAuthor, posts.updatePost)
router.delete('/:id', loadPost, requirePostDeleter, posts.deletePost)
router.post('/:id/like', loadPost, posts.toggleLike)

module.exports = router
