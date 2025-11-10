/**
 * Extracts a user-friendly error message from an API error object.
 *
 * This function is designed to handle errors from Axios, prioritizing
 * the detailed message from the server response body. If that's not available,
 * it falls back to the general error message (like "Network Error").
 *
 * @param err The error object, typically from a catch block.
 * @returns A string containing the most relevant error message.
 */
export function extractError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    // Type assertion to access potential properties
    const possible = err as {
      response?: { data?: { detail?: string } }
      message?: string
    }

    // Priority 1: Get the detailed message from the server's response body.
    // This handles application-level errors (e.g., 400, 401, 404).
    if (possible.response?.data?.detail) {
      return possible.response.data.detail
    }

    // Priority 2: Get the general message from the error object.
    // This handles network-level errors (e.g., "Network Error", "Timeout").
    if (possible.message) {
      return possible.message
    }
  }

  // Fallback for unexpected error types.
  return 'An unexpected error occurred. Please try again.'
}
