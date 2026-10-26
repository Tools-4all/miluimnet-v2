// הנתונים לגרפים בעמוד הסטטיסטיקות
import { http } from './client.js'

export const getStats = () => http.get('/stats') // { totals, postsPerMonth, topGroups }
