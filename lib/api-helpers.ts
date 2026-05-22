/**
 * Typed fetch wrapper that checks response.ok, parses JSON,
 * and throws ApiError on non-2xx responses.
 */

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `API error ${status}: ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Fetch JSON from an API route with automatic error handling.
 *
 * - Calls `fetch(url, options)`
 * - If `!response.ok`, throws `ApiError` with status info
 * - Otherwise parses and returns `response.json()` as `T`
 */
export async function apiFetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message: string | undefined;
    try {
      const body = await response.json();
      message = body?.error ?? body?.message;
    } catch {
      // Response body wasn't JSON — use default message
    }
    throw new ApiError(response.status, response.statusText, message);
  }

  return response.json() as Promise<T>;
}
