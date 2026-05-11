import React, { useState } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import './App.css'

function App() {
  const [userRole, setUserRole] = useState('student')

  return (
    <DashboardLayout userRole={userRole}>
      <div className="dashboard-content">

        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome to TutorSpace - Day 2/50
          </p>
        </div>

        {/* Role Switcher Demo */}
        <div className="demo-section">
          <h2 className="section-title">Role Demo</h2>
          <p className="section-description">
            Switch between user roles to see different navigation:
          </p>

          <div className="role-switcher">
            <button
              className={`role-btn ${userRole === 'student' ? 'role-btn-active' : ''}`}
              onClick={() => setUserRole('student')}
            >
              Student View
            </button>
            <button
              className={`role-btn ${userRole === 'teacher' ? 'role-btn-active' : ''}`}
              onClick={() => setUserRole('teacher')}
            >
              Teacher View
            </button>
            <button
              className={`role-btn ${userRole === 'admin' ? 'role-btn-active' : ''}`}
              onClick={() => setUserRole('admin')}
            >
              Admin View
            </button>
          </div>

          {/* Status Cards */}
          <div className="status-display">
            <div className="status-card">
              <p className="card-label">Current Role</p>
              <h3 className="card-value">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </h3>
            </div>
            <div className="status-card">
              <p className="card-label">Day Progress</p>
              <h3 className="card-value">2 / 50</h3>
            </div>
            <div className="status-card">
              <p className="card-label">Components Built</p>
              <h3 className="card-value">5 Done</h3>
            </div>
            <div className="status-card">
              <p className="card-label">Status</p>
              <h3 className="card-value card-value-success">On Track ✓</h3>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default App
