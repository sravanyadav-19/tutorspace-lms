import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tutorspace-lms.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tutorspace_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUserUpdate = error.config?.url?.includes("/users/") && error.config?.method === "put"
    if (error.response?.status === 401 && !isUserUpdate) {
      localStorage.removeItem('tutorspace_token')
      localStorage.removeItem('tutorspace_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`)
}

export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  createTeacher: (data) => api.post("/users/create-teacher", data)
}

export const classAPI = {
  getAllClasses: () => api.get('/classes'),
  getTeacherClasses: () => api.get('/classes/teacher'),
  getStudentClasses: () => api.get('/classes/student'),
  getClassById: (id) => api.get(`/classes/${id}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  enrollStudent: (classId, userId) => api.post(`/classes/${classId}/enroll/${userId}`),
  removeStudent: (classId, userId) => api.delete(`/classes/${classId}/enroll/${userId}`)
}

export const announcementAPI = {
  getClassAnnouncements: (classId) => api.get(`/announcements/class/${classId}`),
  createAnnouncement: (classId, data) => api.post(`/announcements/class/${classId}`, data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  getAnnouncementComments: (announcementId) => api.get(`/announcements/${announcementId}/comments`),
  addComment: (announcementId, data) => api.post(`/announcements/${announcementId}/comments`, data),
  deleteComment: (commentId) => api.delete(`/announcements/comments/${commentId}`)
}

export const fileAPI = {
  uploadFile: (classId, formData) => api.post(`/files/class/${classId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getClassFiles: (classId) => api.get(`/files/class/${classId}`),
  getTeacherFiles: () => api.get('/files/teacher'),
  getStudentFiles: () => api.get('/files/student'),
  downloadFile: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`)
}

export const quizAPI = {
  createQuiz: (data) => api.post('/quizzes', data),
  getClassQuizzes: (classId) => api.get(`/quizzes/class/${classId}`),
  getQuizById: (quizId) => api.get(`/quizzes/${quizId}`),
  togglePublish: (quizId) => api.patch(`/quizzes/${quizId}/publish`),
  deleteQuiz: (quizId) => api.delete(`/quizzes/${quizId}`),
  getSubmissions: (quizId) => api.get(`/quizzes/${quizId}/submissions`),
  releaseResults: (quizId) => api.patch(`/quizzes/${quizId}/release`),
  getStudentQuizzes: () => api.get('/quizzes/student/all'),
  getStudentResults: () => api.get('/quizzes/student/results'),
  getQuizForStudent: (quizId) => api.get(`/quizzes/student/${quizId}/take`),
  submitQuiz: (quizId, data) => api.post(`/quizzes/student/${quizId}/submit`, data)
}

export default api