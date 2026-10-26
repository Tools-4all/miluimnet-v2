// רשימת פוסטים מלאה: טופס פרסום (אם מותר), הפוסטים עצמם, ו"טען עוד".
// משמשת בפיד, בחיפוש, בעמוד הקבוצה ובפרופיל - כל אחד שולח fetchPage אחר.
// props:
//   fetchPage(page) - מביא עמוד של פוסטים מהשרת
//   form            - props לטופס הפרסום (groups / fixedGroup). בלי - אין טופס
//   emptyText       - מה מציגים כשאין פוסטים
// כדי לטעון רשימה אחרת - מחליפים את ה-key של הקומפוננטה (למשל key={groupId})
import { usePosts } from '../../hooks/usePosts.js'
import PostForm from './PostForm.jsx'
import PostCard from './PostCard.jsx'
import Loading from '../ui/Loading.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatResults } from '../../utils/format.js'

function PostFeed({ fetchPage, form, emptyText = 'אין פוסטים להצגה.', showCount = false }) {
  const { posts, loading, error, hasMore, loadMore, addPost, updatePostInList, removePost } = usePosts(fetchPage)

  return (
    <div className="post-feed">
      {form && <PostForm {...form} onSaved={addPost} />}

      {loading && <Loading />}
      {error && <p className="error">{error}</p>}
      {/* hasMore - יש עוד עמודים, אז המספר האמיתי גדול יותר */}
      {!loading && showCount && <p className="results-count">{hasMore ? `${posts.length}+ תוצאות` : formatResults(posts.length)}</p>}
      {!loading && !error && posts.length === 0 && <EmptyState text={emptyText} />}

      <div className="post-list">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onChange={updatePostInList} onDelete={removePost} />
        ))}
      </div>

      {hasMore && (
        <button className="button-secondary load-more" onClick={loadMore}>
          טען עוד
        </button>
      )}
    </div>
  )
}

export default PostFeed
