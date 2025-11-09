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

export interface FileResponse {
  id: number
  filename: string
  url: string
  size: number
  upload_timestamp: string
}

export interface FileListResponse {
  file_list: FileResponse[]
  total: number
  limit: number
  offset: number
}

export interface UpdateFilenameRequest {
  filename: string
}

export type SortBy = 'upload_timestamp' | 'filename' | 'size'
export type Order = 'asc' | 'desc'

export interface GetFilesParams {
  limit?: number
  offset?: number
  sort_by?: SortBy
  order?: Order
}
