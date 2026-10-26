// middleware של פוסטים - באותו רעיון כמו groupAccess.js:
//   router.put('/:id', loadPost, requirePostAuthor, posts.updatePost)
const Post = require('../models/Post')
const httpError = require('../utils/httpError')
const { getViewer, visibilityFilter } = require('../services/postVisibility')

// מוצא את הפוסט רק אם מותר למשתמש לראות אותו (אחרת 404 - לא מגלים שהפוסט קיים).
// שם ב-req את הפוסט (req.post) ואת פרטי הצפייה של המשתמש (req.viewer)
async function loadPost(req, res, next) {
  req.viewer = await getViewer(req.session.userId)
  const post = await Post.findOne({ $and: [{ _id: req.params.id }, visibilityFilter(req.viewer)] })
    .populate('author', 'username displayName avatar')
    .populate('group', 'name admin')
  if (!post) throw httpError(404, 'הפוסט לא נמצא')
  req.post = post
  next()
}

// רק מי שכתב את הפוסט יכול לערוך אותו
function requirePostAuthor(req, res, next) {
  if (!req.post.isAuthor(req.viewer.id)) throw httpError(403, 'אפשר לערוך רק פוסטים שכתבת')
  next()
}

// למחוק: הכותב, מנהל הקבוצה או מנהל האתר
function requirePostDeleter(req, res, next) {
  if (!req.post.canDelete(req.viewer.id, req.viewer.isSiteAdmin)) {
    throw httpError(403, 'אין לך הרשאה למחוק את הפוסט')
  }
  next()
}

module.exports = { loadPost, requirePostAuthor, requirePostDeleter }
