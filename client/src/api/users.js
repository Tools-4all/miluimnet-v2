// קריאות לשרת שקשורות למשתמשים
import { http } from './client.js'

// filters: { q, unit, city } - פרמטרי חיפוש (כולם לא חובה)
export const getUsers = (filters) => http.get('/users', filters)
export const getUser = (id) => http.get(`/users/${id}`)
export const updateMyProfile = (fields) => http.put('/users/me', fields)
export const deleteMyAccount = () => http.delete('/users/me')
