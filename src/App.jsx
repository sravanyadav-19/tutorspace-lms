import React from 'react'
import Button from './components/shared/Button'
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
            <span className="badge badge-primary">Components Ready</span>
          </div>
          
          <div className="button-showcase">
            <h3 className="showcase-title">Button Component Demo</h3>
            <div className="button-grid">
              <Button variant="primary">Create Class</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="ghost">View Details</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large Button</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
