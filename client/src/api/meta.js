// הרשימות הקבועות מהשרת (סוגי יחידות ואזורים)
import { http } from './client.js'

export const getMeta = () => http.get('/meta')
