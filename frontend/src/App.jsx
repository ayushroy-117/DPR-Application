import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProjectForm from './pages/ProjectForm'
import ProjectList from './pages/ProjectList'
import ProjectView from './pages/ProjectView'
import Navigation from './components/Navigation'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  return (
    <Router>
      {isAuthenticated && <Navigation onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/projects" element={isAuthenticated ? <ProjectList /> : <Navigate to="/login" />} />
        <Route path="/projects/new" element={isAuthenticated ? <ProjectForm /> : <Navigate to="/login" />} />
        <Route path="/projects/:id" element={isAuthenticated ? <ProjectView /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/edit" element={isAuthenticated ? <ProjectForm /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App
