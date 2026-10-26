// חיפוש מתקדם בפוסטים (סעיף 20) - בכל הפוסטים שמותר למשתמש לראות
import { useState } from 'react'
import { getPosts } from '../api/posts.js'
import PostFilters from '../components/posts/PostFilters.jsx'
import PostFeed from '../components/posts/PostFeed.jsx'

function SearchPosts() {
  // search - החיפוש שנשלח בפועל. null = עוד לא חיפשו
  const [search, setSearch] = useState(null)

  return (
    <div className="feed-layout">
      <div className="page-header">
        <h1>חיפוש פוסטים</h1>
        <p>חיפוש בכל הפוסטים שמותר לך לראות: בקבוצות שלך, בקבוצות ציבוריות ואצל החברים.</p>
      </div>

      <PostFilters onSearch={setSearch} />

      {/* key משתנה בכל חיפוש - PostFeed נבנה מחדש וטוען את התוצאות */}
      {search && (
        <PostFeed
          key={JSON.stringify(search)}
          fetchPage={(page) => getPosts({ ...search, page })}
          emptyText="לא נמצאו פוסטים."
          showCount
        />
      )}
    </div>
  )
}

export default SearchPosts
