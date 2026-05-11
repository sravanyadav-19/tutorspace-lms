import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">TutorSpace</h1>
        <p className="app-subtitle">Personal Learning Management System</p>
      </header>
      
      <main className="app-main">
        <div className="welcome-card">
          <h2 className="welcome-title">Welcome to Your LMS</h2>
          <p className="welcome-text">
            Building a warm, approachable learning platform with modern web technologies.
          </p>
          <div className="status-badges">
            <span className="badge badge-success">Day 2/50</span>
            <span className="badge badge-primary">React Ready</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
