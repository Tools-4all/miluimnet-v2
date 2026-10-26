// כרטיס של פוסט אחד: כותב, קבוצה, טקסט, תמונה, סרטון, מחיר, לייקים, ועריכה/מחיקה למי שמותר.
// השרת שולח בכל פוסט canEdit ו-canDelete, אז הכרטיס לא צריך לחשב הרשאות בעצמו
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePost, toggleLike, updatePost } from '../../api/posts.js'
import Avatar from '../ui/Avatar.jsx'
import PostForm from './PostForm.jsx'
import VideoPlayer from './VideoPlayer.jsx'
import { formatDate, formatPrice } from '../../utils/format.js'
import { notify } from '../../utils/notify.js'

// onChange(id, changes) - רק השדות שהשתנו (אחרי לייק, "נמכר" או עריכה). onDelete(id) - אחרי מחיקה
function PostCard({ post, onChange, onDelete }) {
  const [editing, setEditing] = useState(false)

  async function handleLike() {
    try {
      const { liked, likesCount } = await toggleLike(post._id)
      onChange(post._id, { liked, likesCount })
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function toggleSold() {
    try {
      const saved = await updatePost(post._id, { sold: !post.sold })
      onChange(post._id, { sold: saved.sold })
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function handleDelete() {
    if (!window.confirm('למחוק את הפוסט?')) return
    try {
      await deletePost(post._id)
      notify('הפוסט נמחק')
      onDelete(post._id)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  if (editing) {
    return (
      <PostForm
        post={post}
        onSaved={(saved) => {
          onChange(saved._id, saved)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <article className={post.sold ? 'panel post-card post-sold' : 'panel post-card'}>
      <header className="post-header">
        <Link to={`/users/${post.author._id}`}>
          <Avatar user={post.author} size={42} />
        </Link>
        <div>
          <Link to={`/users/${post.author._id}`} className="post-author">
            {post.author.displayName}
          </Link>
          {post.group && (
            <>
              {' ← '}
              <Link to={`/groups/${post.group._id}`} className="post-group">
                {post.group.name}
              </Link>
            </>
          )}
          <span className="card-meta post-date">{formatDate(post.createdAt)}</span>
        </div>
      </header>

      {post.type === 'sale' && (
        <div className="sale-row">
          <span className="pill pill-member">מכירת ציוד</span>
          <span className="price">{formatPrice(post.price)}</span>
          {post.sold && <span className="badge-sold">נמכר</span>}
        </div>
      )}

      <p className="post-text">{post.text}</p>

      {post.image && <img src={post.image} alt="" className="post-image" />}
      {post.videoUrl && <VideoPlayer src={post.videoUrl} />}

      <footer className="post-footer">
        <button className={post.liked ? 'like-button liked' : 'like-button'} onClick={handleLike} aria-pressed={post.liked}>
          {post.liked ? '♥' : '♡'} {post.likesCount}
        </button>
        <div className="actions">
          {post.canEdit && post.type === 'sale' && (
            <button className="link-button" onClick={toggleSold}>
              {post.sold ? 'החזרה למכירה' : 'סימון כנמכר'}
            </button>
          )}
          {post.canEdit && (
            <button className="link-button" onClick={() => setEditing(true)}>
              עריכה
            </button>
          )}
          {post.canDelete && (
            <button className="link-button link-danger" onClick={handleDelete}>
              מחיקה
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}

export default PostCard
