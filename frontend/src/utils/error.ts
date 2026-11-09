import axios from 'axios';

/**
 * Extracts a user-friendly error message from an unknown error (such as an AxiosError),
 * distinguishing network connection issues from credential / validation / server errors.
 */
export function getErrorMessage(
  err: unknown,
  fallbackMessage: string = 'An unexpected error occurred. Please try again.'
): string {
  if (axios.isAxiosError(err)) {
    // 1. Backend structured response message
    const backendMessage = (err.response?.data as { message?: string })?.message;
    if (backendMessage && typeof backendMessage === 'string') {
      return backendMessage;
    }

    // 2. Network connectivity / server unreachable
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to connect to TeamFlow backend server. Please check your network and verify the backend is running.';
    }

    // 3. HTTP Status code fallbacks
    if (err.response.status === 401) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (err.response.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }
    if (err.response.status === 429) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (err.response.status >= 500) {
      return 'Internal server error. Please try again shortly.';
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallbackMessage;
}
