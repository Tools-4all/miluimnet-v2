// קריאות לשרת שקשורות לקבוצות
import { http } from './client.js'

// filters: { q, unitType, region, minMembers, mine } - פרמטרי החיפוש המתקדם (כולם לא חובה)
export const getGroups = (filters) => http.get('/groups', filters)
export const getGroup = (id) => http.get(`/groups/${id}`)
export const createGroup = (fields) => http.post('/groups', fields)
export const updateGroup = (id, fields) => http.put(`/groups/${id}`, fields)
export const deleteGroup = (id) => http.delete(`/groups/${id}`)

export const joinGroup = (id) => http.post(`/groups/${id}/join`)
export const leaveGroup = (id) => http.post(`/groups/${id}/leave`)
export const approveRequest = (id, userId) => http.post(`/groups/${id}/requests/${userId}/approve`)
export const rejectRequest = (id, userId) => http.post(`/groups/${id}/requests/${userId}/reject`)
export const removeMember = (id, userId) => http.delete(`/groups/${id}/members/${userId}`)
