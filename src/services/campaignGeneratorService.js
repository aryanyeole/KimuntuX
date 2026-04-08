import { getAccessToken } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function generateCampaign(payload) {
  const requestPayload = {
    prompt: payload?.prompt || '',
    platforms: Array.isArray(payload?.platforms) ? payload.platforms : [],
    affiliate_product: payload?.affiliate_product || {},
    audience: payload?.audience ?? null,
    num_variants: payload?.num_variants ?? 3,
    language: payload?.language ?? 'en',
    mock_mode: payload?.mock_mode ?? null,
  };

  return apiRequest('/campaigns/generate', {
    method: 'POST',
    body: requestPayload,
  });
}

async function apiRequest(path, { method = 'GET', signal, body } = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!response.ok) {
    const detail = payload?.detail;
    let message = 'Campaign generation request failed';

    if (Array.isArray(detail)) {
      const formatted = detail
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const fieldPath = Array.isArray(item.loc)
            ? item.loc.filter((segment) => segment !== 'body').join('.')
            : '';
          const issue = typeof item.msg === 'string' ? item.msg : 'Invalid value';

          return fieldPath ? `${fieldPath}: ${issue}` : issue;
        })
        .filter(Boolean);

      message = formatted.length
        ? `Error missing information: ${formatted.join('; ')}`
        : 'Error missing information.';
    } else if (typeof detail === 'string' && detail.trim()) {
      message = detail;
    }

    throw new Error(message);
  }

  return payload;
}
