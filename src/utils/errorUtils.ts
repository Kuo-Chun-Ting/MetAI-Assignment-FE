import { isAxiosError } from 'axios'

/**
 * Extracts a user-friendly error message from an API error object.
 */
export function extractError(err: unknown): string {
  if (isAxiosError(err)) {
    return handleAxiosError(err)
  } else if (typeof err === 'object' && err !== null) {
    const possible = err as { message?: string }
    if (possible.message) {
      return possible.message
    }
  }

  return 'An unexpected error occurred. Please try again.'
}

function handleAxiosError(err: Parameters<typeof isAxiosError>[0]): string {
  if (err.response?.data?.detail) {
    return err.response.data.detail
  }

  // Cold start hint only for network/timeout without any response
  if (!err.response && (err.message === 'Network Error' || err.code === 'ECONNABORTED')) {
    return 'Backend server might be cold-starting (Render free tier), please wait a few seconds and try again.'
  }

  if (err.message) {
    return err.message
  }

  return 'An unexpected error occurred. Please try again.'
}
