const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'kimuntu_token';

function buildHeaders({ token, extraHeaders } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };

  const accessToken = token || getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseResponse(response) {
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
    const message = payload?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function mapBackendUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    fullName: user.full_name,
    email: user.email,
    isActive: user.is_active,
    joinDate: user.created_at,
  };
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginWithPassword({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(response);
  return {
    token: data.access_token,
    user: mapBackendUser(data.user),
  };
}

export async function signupWithPassword({ fullName, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });

  const data = await parseResponse(response);
  return {
    token: data.access_token,
    user: mapBackendUser(data.user),
  };
}

export async function fetchCurrentUser({ token } = {}) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: buildHeaders({ token }),
  });

  const data = await parseResponse(response);
  return mapBackendUser(data);
}
