/**
 * Formats an error thrown by src/services/api.js into a human-readable string.
 *
 * api.js attaches `err.responseData` (the raw parsed response body) to every
 * HTTP error it throws. When the backend returns a Pydantic 422, `detail` is
 * an array of validation error objects. This helper formats that array into a
 * newline-separated list of "<field>: <message>" strings.
 */
export function formatApiError(err) {
  const detail = err?.responseData?.detail;

  if (!detail) return err?.message || 'Something went wrong';

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map(e => {
        const path = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : '';
        return path ? `${path}: ${e.msg}` : e.msg;
      })
      .join('\n');
  }

  return JSON.stringify(detail);
}
