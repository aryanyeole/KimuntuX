const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('kimuntu_token');
}

function getTenantId() {
  return localStorage.getItem('kimuntu_tenant_id');
}

function buildHeaders(hasBody = false) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const tenantId = getTenantId();
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function handleResponse(res) {
  if (res.ok) {
    // 204 No Content — nothing to parse
    if (res.status === 204) return null;
    return res.json();
  }

  // Try to extract the error detail from the response body
  let detail = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    detail = body.detail || body.message || JSON.stringify(body);
  } catch {
    // body wasn't JSON — use status text
    detail = res.statusText || detail;
  }
  const err = new Error(detail);
  err.status = res.status;
  throw err;
}

const api = {
  get(path, params) {
    return fetch(buildUrl(path, params), {
      method: 'GET',
      headers: buildHeaders(false),
    }).then(handleResponse);
  },

  post(path, body) {
    return fetch(buildUrl(path), {
      method: 'POST',
      headers: buildHeaders(true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse);
  },

  patch(path, body) {
    return fetch(buildUrl(path), {
      method: 'PATCH',
      headers: buildHeaders(true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse);
  },

  delete(path) {
    return fetch(buildUrl(path), {
      method: 'DELETE',
      headers: buildHeaders(false),
    }).then(handleResponse);
  },
};

export default api;
