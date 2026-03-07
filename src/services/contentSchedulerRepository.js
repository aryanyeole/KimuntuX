// Data repository for Content Scheduler.
// Current mode: JSON (safe, existing behavior).
// Future mode: DB/API (stubbed below).

const JSON_ENDPOINT = '/data/scheduledContent.json';

/**
 * Public API used by the scheduler page.
 * Keep this stable so UI code doesn't change when DB is added.
 */
export async function listContentForScheduler({ userId, signal } = {}) {
  // NOTE: userId is unused in JSON mode, but kept for DB readiness.
  const raw = await listFromJson({ signal });
  return raw.map(normalizeContentRecord);
}

async function listFromJson({ signal } = {}) {
  const res = await fetch(JSON_ENDPOINT, { signal });
  const data = await res.json();
  return data?.scheduled || [];
}

function normalizeContentRecord(item) {
  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    sendDate: item.sendDate || '',
    sendTime: item.sendTime || '',
    recurrence: item.recurrence || 'once',
    endDate: item.endDate || '',
    platforms: Array.isArray(item.platforms) ? item.platforms : [],
    cost: item.cost || '',
    color: item.color || null
  };
}

/* ------------------------------------------------------------------
   DB/API STUBS (intentionally not used yet)
   Uncomment later once backend exists.

async function listFromApi({ userId, signal } = {}) {
  // Example only:
  // const res = await fetch(`/api/users/${userId}/content-scheduler`, { signal });
  // const rows = await res.json();
  // return rows.map(mapDbRowToUiModel);
  return [];
}

function mapDbRowToUiModel(row) {
  return {
    id: row.id,
    title: row.name,
    description: row.description,
    sendDate: row.send_date,
    sendTime: row.send_time,
    recurrence: row.recurrence_rule,
    endDate: row.end_date,
    platforms: row.platforms || [],
    cost: row.cost_cents ? String(row.cost_cents / 100) : '',
    color: row.color_hex
  };
}

function mapUiModelToDbPayload(item, userId) {
  return {
    user_id: userId,
    name: item.title,
    description: item.description,
    send_date: item.sendDate || null,
    send_time: item.sendTime || null,
    recurrence_rule: item.recurrence,
    end_date: item.endDate || null,
    platforms: item.platforms,
    cost_cents: item.cost ? Math.round(Number(item.cost) * 100) : 0,
    color_hex: item.color
  };
}
------------------------------------------------------------------ */
