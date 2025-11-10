import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 180000,
})

// Request interceptor: Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginOrRegister =
        error.config.url === '/auth/login' || error.config.url === '/auth/register'

      if (!isLoginOrRegister) {
        // Token invalid for protected routes, clear and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
