// קריאות לשרת שקשורות לחברים. כל פעולה מחזירה { status } - הקשר החדש עם המשתמש
import { http } from './client.js'

export const getFriends = () => http.get('/friends') // { friends, requests }
export const sendFriendRequest = (userId) => http.post(`/friends/requests/${userId}`)
export const cancelFriendRequest = (userId) => http.delete(`/friends/requests/${userId}`)
export const acceptFriendRequest = (userId) => http.post(`/friends/requests/${userId}/accept`)
export const rejectFriendRequest = (userId) => http.post(`/friends/requests/${userId}/reject`)
export const removeFriend = (userId) => http.delete(`/friends/${userId}`)
