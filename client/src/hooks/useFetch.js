// custom hook: טוען נתונים מהשרת ומנהל את שלושת המצבים - טוען, שגיאה ונתונים.
// בלי ה-hook הזה, כל עמוד היה כותב מחדש את אותם useState ו-useEffect.
//
// שימוש:
//   const { data, loading, error, reload, setData } = useFetch(() => getUser(id), [id])
import { useCallback, useEffect, useState } from 'react'

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // useCallback - הפונקציה נוצרת מחדש רק כשהתלויות (deps) משתנות, למשל id אחר בכתובת
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await load())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [load])

  // טוענים בפעם הראשונה, ושוב כשהתלויות משתנות
  useEffect(() => {
    reload()
  }, [reload])

  // setData מוחזר כדי שעמוד יוכל לעדכן את הנתונים בלי לטעון מחדש (למשל אחרי עריכה)
  return { data, loading, error, reload, setData }
}
