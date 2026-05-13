import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'

// Protected Route
import ProtectedRoute from './components/shared/ProtectedRoute'

// Dashboard Layout
import DashboardLayout from './components/layout/DashboardLayout'

// App CSS
import './App.css'

// ================================
// PLACEHOLDER PAGES
// (We'll build these in coming days)
// ================================
const Dashboard = () => {
  const { user } = useAuth()
  return (
    <DashboardLayout userRole={user?.role}>
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="page-subtitle">
            {user?.role === 'admin' && 
              'Manage your TutorSpace platform'}
            {user?.role === 'teacher' && 
              'Manage your classes and students'}
            {user?.role === 'student' && 
              'Continue your learning journey'}
          </p>
        </div>

        <div className="demo-section">
          <h2 className="section-title">
            🎉 You are logged in!
          </h2>
          <p className="section-description">
            Day 4/50 - Authentication is working!
            More features coming soon.
          </p>

          <div className="status-display">
            <div className="status-card">
              <p className="card-label">Name</p>
              <h3 className="card-value">{user?.name}</h3>
            </div>
            <div className="status-card">
              <p className="card-label">Role</p>
              <h3 className="card-value">{user?.role}</h3>
            </div>
            <div className="status-card">
              <p className="card-label">Status</p>
              <h3 className="card-value">{user?.status}</h3>
            </div>
            <div className="status-card">
              <p className="card-label">Day</p>
              <h3 className="card-value">4/50</h3>
            </div>
          </div>
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
    padding: '24px'
  }}>
    <h1 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '38px',
      color: 'var(--color-ink)',
      margin: 0
    }}>
      403
    </h1>
    <p style={{
      fontFamily: 'var(--font-body)',
      color: 'var(--color-muted)',
      margin: 0
    }}>
      You don't have permission to access this page.
    </p>
    <a href="/dashboard" style={{
      color: 'var(--color-primary)',
      fontFamily: 'var(--font-body)'
    }}>
      Go to Dashboard
    </a>
  </div>
)

// ================================
// MAIN APP ROUTES
// ================================
function App() {
  const { isAuthenticated, user } = useAuth()

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

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Utility Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Default redirect */}
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
