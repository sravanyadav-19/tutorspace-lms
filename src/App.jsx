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

// Protected Route
import ProtectedRoute from './components/shared/ProtectedRoute'

// Dashboard Layout
import DashboardLayout from './components/layout/DashboardLayout'

import './App.css'

// ================================
// PLACEHOLDER PAGES
// ================================
const TeacherDashboard = () => {
  const { user } = useAuth()
  return (
    <DashboardLayout userRole="teacher">
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="page-subtitle">
            Teacher Dashboard - Coming Day 6!
          </p>
        </div>
        <div className="demo-section">
          <h2 className="section-title">
            🚧 Under Construction
          </h2>
          <p className="section-description">
            Teacher features being built in Day 6.
            Check back soon!
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

const StudentDashboard = () => {
  const { user } = useAuth()
  return (
    <DashboardLayout userRole="student">
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="page-subtitle">
            Student Dashboard - Coming Day 7!
          </p>
        </div>
        <div className="demo-section">
          <h2 className="section-title">
            🚧 Under Construction
          </h2>
          <p className="section-description">
            Student features being built in Day 7.
            Check back soon!
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

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

// ================================
// SMART DASHBOARD REDIRECT
// ================================
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

// ================================
// MAIN APP ROUTES
// ================================
function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
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

      {/* Smart Dashboard Redirect */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SmartDashboard />
          </ProtectedRoute>
        }
      />

      {/* ========================
          ADMIN ROUTES
      ======================== */}
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

      {/* ========================
          TEACHER ROUTES
      ======================== */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* ========================
          STUDENT ROUTES
      ======================== */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Utility */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  )
}

export default App
