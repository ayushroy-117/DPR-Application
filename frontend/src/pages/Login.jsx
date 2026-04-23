import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/api'

export default function Login({ onLogin }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const [error, setError] = React.useState('')

  const onSubmit = async (data) => {
    try {
      setError('')
      const response = await authService.login(data.email, data.password)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      onLogin()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-green-700">DPR Generator</h1>
        <p className="text-center text-gray-600 mb-6">Login to your account</p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="form-input"
              placeholder="your@email.com"
            />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="form-input"
              placeholder="••••••••"
            />
            {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-green-600 font-semibold hover:text-green-700">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  )
}
