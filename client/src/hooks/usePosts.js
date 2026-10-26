// מנהל רשימת פוסטים: טעינה, "טען עוד" (עמודים), והוספה / עדכון / מחיקה של פוסט ברשימה.
// בנוי מעל useFetch. בגרסה 1 הקוד הזה היה כתוב מחדש בפיד, בחיפוש, בעמוד הקבוצה ובפרופיל.
//
// שימוש:
//   const { posts, loading, error, hasMore, loadMore, addPost, updatePostInList, removePost } =
//     usePosts((page) => getPosts({ group: id, page }))
// כדי לטעון רשימה אחרת (למשל קבוצה אחרת) - מחליפים את ה-key של הקומפוננטה שמשתמשת ב-hook
import { useFetch } from './useFetch.js'
import { POSTS_PAGE_SIZE } from '../api/posts.js'
import { notify } from '../utils/notify.js'

// עמוד אחד מהשרת -> המצב של הרשימה
async function fetchPageState(fetchPage, page, previous = []) {
  const list = await fetchPage(page)
  return { list: [...previous, ...list], page, hasMore: list.length === POSTS_PAGE_SIZE }
}

export function usePosts(fetchPage) {
  const { data, loading, error, setData } = useFetch(() => fetchPageState(fetchPage, 0), [])
  const posts = data?.list || []

  async function loadMore() {
    try {
      setData(await fetchPageState(fetchPage, data.page + 1, data.list))
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  // setData עם פונקציה - מקבלים את המצב העדכני ביותר (למשל אם שתי פעולות קרו מהר אחת אחרי השנייה)
  const updateList = (change) => setData((current) => ({ ...current, list: change(current.list) }))

  return {
    posts,
    loading,
    error,
    hasMore: Boolean(data?.hasMore),
    loadMore,
    addPost: (post) => updateList((list) => [post, ...list]),
    // מקבל רק את השדות שהשתנו, וממזג אותם לגרסה העדכנית שברשימה.
    // (אם היינו מחליפים בעותק שהכרטיס החזיק - לייק וסימון "נמכר" שנלחצים מהר היו דורסים זה את זה)
    updatePostInList: (id, changes) =>
      updateList((list) => list.map((p) => (p._id === id ? { ...p, ...changes } : p))),
    removePost: (id) => updateList((list) => list.filter((p) => p._id !== id)),
  }
}
