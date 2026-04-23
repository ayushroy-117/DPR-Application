import axios from 'axios'

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || '/api'
  // Ensure the URL ends with /api for consistency
  return url.endsWith('/api') ? url : (url.endsWith('/') ? `${url}api` : `${url}/api`)
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const authService = {
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password })
}

export const projectService = {
  create: (data) => api.post('/projects', data),
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  calculateFinancials: (id) => api.post(`/projects/${id}/calculate`),
  generatePDF: (id) => {
    const token = localStorage.getItem('token')
    return axios.get(`${getBaseURL()}/pdf/generate/${id}`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
  }
}

export default api
