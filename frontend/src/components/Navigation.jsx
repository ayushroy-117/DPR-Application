import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'

export default function Navigation({ onLogout }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggleDark = () => setDark(d => !d)

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-xl sticky top-0 z-50">
      <div className="container flex justify-between items-center py-3 px-4">
        <Link to="/dashboard" className="text-2xl font-bold tracking-tight">
          DPR Generator
        </Link>

        <div className="hidden md:flex space-x-1 items-center">
          <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition">Dashboard</Link>
          <Link to="/projects" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition">Projects</Link>
          <Link to="/projects/new" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition">New Project</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="p-2 rounded-md hover:bg-green-600 transition"
            title="Toggle dark mode"
          >
            {dark ? '🌙' : '☀️'}
          </button>
          <span className="text-sm font-medium">Hi, {user.name?.split(' ')[0]}!</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="p-2 rounded-md hover:bg-green-600 transition"
            title="Toggle dark mode"
          >
            {dark ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md hover:bg-green-600 transition"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-green-600 border-t border-green-500">
          <div className="container px-4 py-3 space-y-2">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-green-500 transition"
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-green-500 transition"
              onClick={closeMenu}
            >
              Projects
            </Link>
            <Link
              to="/projects/new"
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-green-500 transition"
              onClick={closeMenu}
            >
              New Project
            </Link>
            <div className="border-t border-green-500 pt-2 mt-2">
              <span className="block px-3 py-2 text-sm font-medium">Hi, {user.name?.split(' ')[0]}!</span>
              <button
                onClick={() => {
                  handleLogout()
                  closeMenu()
                }}
                className="w-full flex items-center gap-2 bg-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
