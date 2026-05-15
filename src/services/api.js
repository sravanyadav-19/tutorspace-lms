import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ================================
// AUTH API
// ================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile')
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
  getTeacherClasses: () => api.get('/classes/teacher'), // NEW!
  getClassById: (id) => api.get(`/classes/${id}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  enrollStudent: (classId, userId) => 
    api.post(`/classes/${classId}/enroll/${userId}`),
  removeStudent: (classId, userId) => 
    api.delete(`/classes/${classId}/enroll/${userId}`)
}

// ================================
// ANNOUNCEMENT API (NEW!)
// ================================
export const announcementAPI = {
  getClassAnnouncements: (classId) => 
    api.get(`/classes/${classId}/announcements`),
  createAnnouncement: (classId, data) => 
    api.post(`/classes/${classId}/announcements`, data),
  updateAnnouncement: (id, data) => 
    api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => 
    api.delete(`/announcements/${id}`),
  
  // Comments
  getAnnouncementComments: (announcementId) => 
    api.get(`/announcements/${announcementId}/comments`),
  addComment: (announcementId, data) => 
    api.post(`/announcements/${announcementId}/comments`, data),
  deleteComment: (commentId) => 
    api.delete(`/comments/${commentId}`)
}

export default api
