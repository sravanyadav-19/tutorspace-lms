import React, { useState } from 'react'
import Button from './components/shared/Button'
import Input, { Textarea } from './components/shared/Input'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">TutorSpace</h1>
        <p className="app-subtitle">Personal Learning Management System</p>
      </header>
      
      <main className="app-main">
        <div className="welcome-card">
          <h2 className="welcome-title">Component Demo</h2>
          <p className="welcome-text">
            Building a warm, approachable learning platform with modern web technologies.
          </p>
          
          <div className="status-badges">
            <span className="badge badge-success">Day 2/50</span>
            <span className="badge badge-primary">UI Components Ready</span>
          </div>
          
          <div className="component-showcase">
            <h3 className="showcase-title">Form Components</h3>
            <form className="demo-form" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                helperText="We'll never share your email"
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={password.length > 0 && password.length < 6 ? 'Password must be at least 6 characters' : null}
              />
              
              <Textarea
                label="Class Description"
                placeholder="Describe your class..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helperText="Provide a brief description for students"
                rows={3}
              />
              
              <div className="form-actions">
                <Button variant="primary" type="submit">Create Class</Button>
                <Button variant="secondary">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
