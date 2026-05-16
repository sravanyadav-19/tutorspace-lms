import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import NewClass from './pages/admin/Classes/NewClass'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard/TeacherDashboard'
import TeacherClasses from './pages/teacher/Classes/TeacherClasses'
import NewAnnouncement from './pages/teacher/Announcements/New/NewAnnouncement'
import TeacherFiles from './pages/teacher/Files/TeacherFiles'

// Student Pages
import StudentDashboard from './pages/student/Dashboard/StudentDashboard'
import StudentAnnouncements from './pages/student/Announcements/StudentAnnouncements'
import AnnouncementDetail from './pages/student/Announcements/Detail/AnnouncementDetail'

// Protected Route
import ProtectedRoute from './components/shared/ProtectedRoute'

import './App.css'

const Unauthorized = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--color-canvas)',
    gap: '16px',
    padding: '24px',
    textAlign: 'center'
  }}>
    <h1 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '64px',
      color: 'var(--color-primary)',
      margin: 0
    }}>403</h1>
    <h2 style={{
      fontFamily: 'var(--font-display)',
      color: 'var(--color-ink)',
      margin: 0
    }}>Access Denied</h2>
    <p style={{
      fontFamily: 'var(--font-body)',
      color: 'var(--color-muted)',
      margin: 0
    }}>
      You don't have permission to view this page.
    </p>
    <a href="/dashboard" style={{
      color: 'var(--color-primary)',
      fontFamily: 'var(--font-body)',
      fontWeight: 'bold'
    }}>
      ← Go to Dashboard
    </a>
  </div>
)

const SmartDashboard = () => {
  const { user } = useAuth()
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />
    case 'student':
    default:
      return <Navigate to="/student/dashboard" replace />
  }
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated()
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated()
            ? <Navigate to="/dashboard" replace />
            : <Register />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SmartDashboard />
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes/new"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <NewClass />
          </ProtectedRoute>
        }
      />

      {/* TEACHER ROUTES */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes/:classId/announcements/new"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <NewAnnouncement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/files"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherFiles />
          </ProtectedRoute>
        }
      />

      {/* STUDENT ROUTES */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <StudentAnnouncements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements/:announcementId"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <AnnouncementDetail />
          </ProtectedRoute>
        }
      />

      {/* Utility */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
