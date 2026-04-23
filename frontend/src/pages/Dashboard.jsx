import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectService } from '../services/api'
import { Plus, TrendingUp, FileText, Target } from 'lucide-react'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState({
    total: '--',
    active: '--',
    avgDscr: '--',
    createdThisMonth: '--'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await projectService.getAll()
        const projects = res.data || []
        const total = projects.length
        const active = projects.filter(p => p.status === 'active').length
        const dscrs = projects.map(p => Number(p.dscr?.averageDSCR)).filter(Boolean)
        const avgDscr = dscrs.length ? (dscrs.reduce((a, b) => a + b, 0) / dscrs.length).toFixed(2) : '--'
        const now = new Date()
        const createdThisMonth = projects.filter(p => {
          const d = new Date(p.createdAt)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        setStats({ total, active, avgDscr, createdThisMonth })
      } catch (err) {
        setError('Failed to load project stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="container py-12">
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome, {user.name}!</h1>
        <p className="text-gray-600">Create and manage your Detailed Project Reports</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-500 rounded-lg text-white">
              <FileText size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Total Projects</h3>
          <p className="text-3xl font-bold text-blue-600">{loading ? '--' : stats.total}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-500 rounded-lg text-white">
              <Target size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-green-600">{loading ? '--' : stats.active}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-500 rounded-lg text-white">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Avg. DSCR</h3>
          <p className="text-3xl font-bold text-purple-600">{loading ? '--' : stats.avgDscr}</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-500 rounded-lg text-white">
              <Plus size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Created This Month</h3>
          <p className="text-3xl font-bold text-orange-600">{loading ? '--' : stats.createdThisMonth}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/projects/new" className="block w-full btn btn-primary text-lg">
              <Plus className="inline mr-2" size={20} /> Create New Project
            </Link>
            <Link to="/projects" className="block w-full btn btn-secondary text-lg">
              View All Projects
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-green-600">1.</span>
              <span>Create a new project with basic business information</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-green-600">2.</span>
              <span>Fill in financial details (costs, capital, revenue)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-green-600">3.</span>
              <span>System calculates DSCR, ratios, and projections</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-green-600">4.</span>
              <span>Generate professional PDF report ready for banks</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
