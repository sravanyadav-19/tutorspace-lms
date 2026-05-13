import axios from 'axios'

// ================================
// BASE CONFIGURATION
// ================================
const BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// ================================
// REQUEST INTERCEPTOR
// Adds JWT token to every request
// ================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tutorspace_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ================================
// RESPONSE INTERCEPTOR
// Handles token expiry globally
// ================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('tutorspace_token')
      localStorage.removeItem('tutorspace_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ================================
// AUTH API
// ================================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
}

// ================================
// USER API
// ================================
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
}

// ================================
// CLASS API
// ================================
export const classAPI = {
  getAllClasses: () => api.get('/classes'),
  getClassById: (id) => api.get(`/classes/${id}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  enrollStudent: (classId, userId) => 
    api.post(`/classes/${classId}/enroll`, { userId })
}

export default api
