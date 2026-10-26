// קריאות לשרת שקשורות לפוסטים
import { http } from './client.js'

// השרת מחזיר עד 30 פוסטים בכל עמוד. אם הגיעו פחות - אין עוד עמודים
export const POSTS_PAGE_SIZE = 30

export const getFeed = (page = 0) => http.get('/posts/feed', { page })
// filters: { q, type, from, to, minPrice, maxPrice, group, author, page } - כולם לא חובה
export const getPosts = (filters) => http.get('/posts', filters)
export const createPost = (fields) => http.post('/posts', fields)
export const updatePost = (id, fields) => http.put(`/posts/${id}`, fields)
export const deletePost = (id) => http.delete(`/posts/${id}`)
export const toggleLike = (id) => http.post(`/posts/${id}/like`)
