import React from 'react'
import { Link } from 'react-router-dom'
import { projectService } from '../services/api'
import { Edit2, Trash2, Download, Eye } from 'lucide-react'

export default function ProjectList() {
  const [projects, setProjects] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectService.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.delete(id)
        setProjects(projects.filter(p => p._id !== id))
      } catch (error) {
        console.error('Failed to delete project')
      }
    }
  }

  const handleDownloadPDF = async (id, name) => {
    try {
      const response = await projectService.generatePDF(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `DPR_${name}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
    } catch (error) {
      console.error('Failed to download PDF')
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link to="/projects/new" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-6">No projects yet</p>
          <Link to="/projects/new" className="btn btn-primary">
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Business Name</th>
                <th className="px-6 py-3 text-left">Promoter</th>
                <th className="px-6 py-3 text-left">Project Cost</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{project.basicInfo?.businessName || 'Unnamed'}</td>
                  <td className="px-6 py-4">{project.basicInfo?.promoterName || 'N/A'}</td>
                  <td className="px-6 py-4">₹{(project.totalProjectRequirement || 0).toFixed(0)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      project.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                      project.status === 'submitted' ? 'bg-blue-200 text-blue-800' :
                      project.status === 'approved' ? 'bg-green-200 text-green-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      title="View"
                    >
                      <Eye size={18} />
                    </Link>
                    <Link
                      to={`/projects/${project._id}/edit`}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </Link>
                    <button
                      onClick={() => handleDownloadPDF(project._id, project.basicInfo?.businessName || 'Report')}
                      className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
