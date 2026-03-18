import { getAccessToken } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// Canonical scheduler record contract used across UI and future API mode.
export const SCHEDULER_RECURRENCE_OPTIONS = ['once', 'weekly', 'biweekly', 'monthly'];

export const SCHEDULER_DEFAULTS = {
  id: null,
  title: '',
  description: '',
  sendDate: '',
  sendTime: '',
  recurrence: 'once',
  endDate: '',
  platforms: [],
  cost: '',
  color: null,
};

/**
 * Public API used by the scheduler page.
 * Keep this stable so UI code doesn't change when DB is added.
 */
export async function listContentForScheduler({ userId, signal } = {}) {
  // NOTE: userId is unused because ownership is derived from JWT auth.
  const rows = await apiRequest('/scheduler', { signal });
  return rows.map(mapApiRowToUiModel);
}

export function normalizeSchedulerInput(item) {
  return normalizeContentRecord(item);
}

export async function createContentForScheduler(item, { signal } = {}) {
  const row = await apiRequest('/scheduler', {
    method: 'POST',
    signal,
    body: mapUiModelToApiPayload(item),
  });
  return mapApiRowToUiModel(row);
}

export async function updateContentForScheduler(itemId, item, { signal } = {}) {
  const row = await apiRequest(`/scheduler/${itemId}`, {
    method: 'PUT',
    signal,
    body: mapUiModelToApiPayload(item),
  });
  return mapApiRowToUiModel(row);
}

export async function deleteContentForScheduler(itemId, { signal } = {}) {
  await apiRequest(`/scheduler/${itemId}`, {
    method: 'DELETE',
    signal,
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
    const message = payload?.detail || 'Scheduler request failed';
    throw new Error(message);
  }

  return payload;
}

function normalizeContentRecord(item) {
  const recurrence = item?.recurrence || item?.interval || SCHEDULER_DEFAULTS.recurrence;

  return {
    id: item?.id ?? SCHEDULER_DEFAULTS.id,
    title: item?.title || item?.name || SCHEDULER_DEFAULTS.title,
    description: item?.description || SCHEDULER_DEFAULTS.description,
    sendDate: item?.sendDate || item?.startDate || SCHEDULER_DEFAULTS.sendDate,
    sendTime: item?.sendTime || item?.timeOfDay || item?.startTime || SCHEDULER_DEFAULTS.sendTime,
    recurrence: SCHEDULER_RECURRENCE_OPTIONS.includes(recurrence)
      ? recurrence
      : SCHEDULER_DEFAULTS.recurrence,
    endDate: item?.endDate || SCHEDULER_DEFAULTS.endDate,
    platforms: Array.isArray(item?.platforms) ? item.platforms : SCHEDULER_DEFAULTS.platforms,
    cost: item?.cost ?? SCHEDULER_DEFAULTS.cost,
    color: item?.color ?? SCHEDULER_DEFAULTS.color,
  };
}

function mapApiRowToUiModel(row) {
  return normalizeContentRecord({
    id: row?.id,
    title: row?.name,
    sendDate: row?.start_date,
    sendTime: row?.send_time,
    recurrence: row?.interval,
    endDate: row?.end_date,
    platforms: row?.platforms,
    cost: row?.cost,
    color: row?.color,
  });
}

function mapUiModelToApiPayload(item) {
  const normalized = normalizeContentRecord(item);
  return {
    name: normalized.title,
    start_date: normalized.sendDate || null,
    end_date: normalized.endDate || null,
    send_time: normalized.sendTime || null,
    interval: normalized.recurrence,
    platforms: normalized.platforms,
    cost: normalized.cost ? String(normalized.cost) : null,
    color: normalized.color,
  };
}
