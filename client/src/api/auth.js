// קריאות לשרת שקשורות להתחברות
import { http } from './client.js'

export const getMe = () => http.get('/auth/me')
export const login = (username, password) => http.post('/auth/login', { username, password })
export const register = (details) => http.post('/auth/register', details)
export const logout = () => http.post('/auth/logout')
