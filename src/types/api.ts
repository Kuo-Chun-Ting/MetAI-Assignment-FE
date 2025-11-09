export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  username: string
  token: string
  message: string
}

export interface ErrorResponse {
  detail: string
}
