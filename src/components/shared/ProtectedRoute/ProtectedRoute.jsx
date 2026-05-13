import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, user, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-canvas)',
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        color: 'var(--color-primary)'
      }}>
        Loading TutorSpace...
      </div>
    )
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions
  if (allowedRoles.length > 0 && 
      !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
