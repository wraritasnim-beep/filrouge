import axios from 'axios'

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api', headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const isAuthCall = url.includes('/auth/login/') || url.includes('/auth/register/')
      if (!isAuthCall) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
export default api

export const authAPI = {
  register: (d) => api.post('/auth/register/', d),
  login: (d) => api.post('/auth/login/', d),
  me: () => api.get('/auth/me/'),
  users: () => api.get('/auth/users/'),
}

export const projectAPI = {
  list: () => api.get('/projects/'),
  create: (d) => api.post('/projects/', d),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, d) => api.patch(`/projects/${id}/`, d),
  delete: (id) => api.delete(`/projects/${id}/`),
  addMember: (id, uid) => api.post(`/projects/${id}/members/`, { user_id: uid }),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/`, { data: { user_id: uid } }),
  dashboard: (id) => api.get(`/projects/${id}/dashboard/`),
  teacherDashboard: () => api.get('/teacher/dashboard/'),
}

export const taskAPI = {
  list: (pid, params) => api.get(`/projects/${pid}/tasks/`, { params }),
  create: (pid, d) => api.post(`/projects/${pid}/tasks/`, d),
  get: (id) => api.get(`/tasks/${id}/`),
  update: (id, d) => api.patch(`/tasks/${id}/`, d),
  delete: (id) => api.delete(`/tasks/${id}/`),
  updateStatus: (id, status, order) => api.patch(`/tasks/${id}/status/`, { status, order }),
  myTasks: () => api.get('/my-tasks/'),
}

export const sprintAPI = {
  list: (pid) => api.get(`/projects/${pid}/sprints/`),
  create: (pid, d) => api.post(`/projects/${pid}/sprints/`, d),
  get: (id) => api.get(`/sprints/${id}/`),
  update: (id, d) => api.patch(`/sprints/${id}/`, d),
  delete: (id) => api.delete(`/sprints/${id}/`),
}

export const messageAPI = {
  list: (pid) => api.get(`/projects/${pid}/messages/`),
  create: (pid, content) => api.post(`/projects/${pid}/messages/`, { content }),
}

export const evaluationAPI = {
  list: (pid) => api.get(`/projects/${pid}/evaluations/`),
  create: (pid, d) => api.post(`/projects/${pid}/evaluations/`, d),
  update: (id, d) => api.patch(`/evaluations/${id}/`, d),
  delete: (id) => api.delete(`/evaluations/${id}/`),
}
