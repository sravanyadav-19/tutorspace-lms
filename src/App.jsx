import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Settings from './pages/Settings/Settings'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import NewClass from './pages/admin/Classes/NewClass'
import AdminClassDetail from './pages/admin/Classes/AdminClassDetail'

import TeacherDashboard from './pages/teacher/Dashboard/TeacherDashboard'
import TeacherClasses from './pages/teacher/Classes/TeacherClasses'
import TeacherClassDetail from './pages/teacher/Classes/TeacherClassDetail'
import NewAnnouncement from './pages/teacher/Announcements/New/NewAnnouncement'
import TeacherFiles from './pages/teacher/Files/TeacherFiles'
import TeacherQuiz from './pages/teacher/Quiz/TeacherQuiz'
import TeacherAnalytics from './pages/teacher/Analytics/TeacherAnalytics'

import StudentDashboard from './pages/student/Dashboard/StudentDashboard'
import StudentClasses from './pages/student/Classes/StudentClasses'
import StudentAnnouncements from './pages/student/Announcements/StudentAnnouncements'
import AnnouncementDetail from './pages/student/Announcements/Detail/AnnouncementDetail'
import StudentFiles from './pages/student/Files/StudentFiles'
import StudentQuiz from './pages/student/Quiz/StudentQuiz'
import TakeQuiz from './pages/student/Quiz/TakeQuiz'
import StudentResults from './pages/student/Results/StudentResults'

import ProtectedRoute from './components/shared/ProtectedRoute'
import './App.css'

const Unauthorized = () => (
  <main
    id="main-content"
    role="main"
    aria-label="Access denied"
    tabIndex={-1}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'var(--color-canvas)', gap: '16px',
      padding: '24px', textAlign: 'center'
    }}
  >
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '64px',
      color: 'var(--color-primary)', margin: 0 }}>403</h1>
    <h2 style={{ fontFamily: 'var(--font-display)',
      color: 'var(--color-ink)', margin: 0 }}>Access Denied</h2>
    <p style={{ fontFamily: 'var(--font-body)',
      color: 'var(--color-muted)', margin: 0 }}>
      You don't have permission to view this page.
    </p>
    <a
      href="/dashboard"
      style={{ color: 'var(--color-primary)',
      fontFamily: 'var(--font-body)', fontWeight: 'bold' }}
      aria-label="Go to dashboard"
    >
      &#8592; Go to Dashboard
    </a>
  </main>
)

const SmartDashboard = () => {
  const { user } = useAuth()
  switch (user?.role) {
    case 'admin': return <Navigate to="/admin/dashboard" replace />
    case 'teacher': return <Navigate to="/teacher/dashboard" replace />
    case 'student': default: return <Navigate to="/student/dashboard" replace />
  }
}

function App() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />

      {/* SETTINGS - available to all authenticated users */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* ADMIN */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><AdminClasses /></ProtectedRoute>} />
      <Route path="/admin/classes/new" element={<ProtectedRoute allowedRoles={['admin']}><NewClass /></ProtectedRoute>} />
      <Route path="/admin/classes/:classId" element={<ProtectedRoute allowedRoles={['admin']}><AdminClassDetail /></ProtectedRoute>} />

      {/* TEACHER */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherClasses /></ProtectedRoute>} />
      <Route path="/teacher/classes/:classId" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherClassDetail /></ProtectedRoute>} />
      <Route path="/teacher/classes/:classId/announcements/new" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><NewAnnouncement /></ProtectedRoute>} />
      <Route path="/teacher/files" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherFiles /></ProtectedRoute>} />
      <Route path="/teacher/quizzes" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherQuiz /></ProtectedRoute>} />
      <Route path="/teacher/analytics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherAnalytics /></ProtectedRoute>} />

      {/* STUDENT */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/classes" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentClasses /></ProtectedRoute>} />
      <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentAnnouncements /></ProtectedRoute>} />
      <Route path="/student/announcements/:announcementId" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><AnnouncementDetail /></ProtectedRoute>} />
      <Route path="/student/files" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentFiles /></ProtectedRoute>} />
      <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentQuiz /></ProtectedRoute>} />
      <Route path="/student/quizzes/:quizId/take" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><TakeQuiz /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><StudentResults /></ProtectedRoute>} />

      {/* UTILITY */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App