import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const username = ref<string | null>(localStorage.getItem('username'))
  const isAuthenticated = ref(!!token.value)

  async function login(credentials: LoginRequest) {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    const { token: newToken, username: user } = response.data

    token.value = newToken
    username.value = user
    isAuthenticated.value = true

    localStorage.setItem('token', newToken)
    localStorage.setItem('username', user)

    return response.data
  }

  async function register(credentials: RegisterRequest) {
    const response = await api.post<AuthResponse>('/auth/register', credentials)
    const { token: newToken, username: user } = response.data

    token.value = newToken
    username.value = user
    isAuthenticated.value = true

    localStorage.setItem('token', newToken)
    localStorage.setItem('username', user)

    return response.data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout API failed:', err)
      throw err // Re-throw the error so the calling component can handle it
    } finally {
      token.value = null
      username.value = null
      isAuthenticated.value = false

      localStorage.removeItem('token')
      localStorage.removeItem('username')
    }
  }

  return {
    token,
    username,
    isAuthenticated,
    login,
    register,
    logout,
  }
})
