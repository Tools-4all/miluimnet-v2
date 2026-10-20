// מחזיר את הרשימות הקבועות מהשרת: { unitTypes, regions }.
// הן לא משתנות בזמן שהאתר פתוח, אז טוענים אותן פעם אחת בלבד ושומרים בזיכרון (cache)
// לכל הקומפוננטות שמשתמשות ב-hook.
import { useEffect, useState } from 'react'
import { getMeta } from '../api/meta.js'

let cache = null // התשובה מהשרת, אחרי שהגיעה
let pending = null // הבקשה שבדרך - כדי לא לשלוח אותה פעמיים במקביל

export function useMeta() {
  const [meta, setMeta] = useState(cache)

  useEffect(() => {
    if (cache) return
    let active = true // אם הקומפוננטה נסגרה לפני שהתשובה הגיעה - לא מעדכנים אותה
    pending = pending || getMeta()
    pending
      .then((data) => {
        cache = data
        if (active) setMeta(data)
      })
      .catch(() => {
        pending = null // נכשל - בפעם הבאה ננסה שוב
      })
    return () => {
      active = false
    }
  }, [])

  return meta || { unitTypes: [], regions: [] }
}
