import api from './axios'
import type {
  FileResponse,
  FileListResponse,
  GetFilesParams,
  UpdateFilenameRequest,
} from '../types/api'

const DEFAULT_LIMIT = 10

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<FileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<FileResponse>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      const percent = Math.round((event.loaded * 100) / event.total)
      onProgress(percent)
    },
  })

  return response.data
}

export async function getFiles(params: GetFilesParams = {}): Promise<FileListResponse> {
  const response = await api.get<FileListResponse>('/files', {
    params: {
      limit: params.limit ?? DEFAULT_LIMIT,
      offset: params.offset ?? 0,
      sort_by: params.sort_by ?? 'upload_timestamp',
      order: params.order ?? 'desc',
    },
  })

  return response.data
}

export async function downloadFile(
  fileId: number
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await api.get<Blob>(`/files/${fileId}/download`, {
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const filename = extractFilename(disposition)

  return { blob: response.data, filename }
}

export async function updateFilename(fileId: number, filename: string): Promise<FileResponse> {
  const payload: UpdateFilenameRequest = { filename }
  const response = await api.put<FileResponse>(`/files/${fileId}`, payload)
  return response.data
}

export async function deleteFile(fileId: number): Promise<void> {
  await api.delete(`/files/${fileId}`)
}

function extractFilename(header?: string): string | null {
  if (!header) return null
  const match = header.match(/filename="([^"]+)"/)
  return match ? match[1] : null
}
