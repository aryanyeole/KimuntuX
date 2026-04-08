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
  isUsed: false,
};

/**
 * Public API used by the scheduler page.
 * Keep this stable so UI code doesn't change when DB is added.
 */
export async function listContentForScheduler({ userId, signal } = {}) {
  // NOTE: userId is unused because ownership is derived from JWT auth.
  const rows = await apiRequest('/campaigns', { signal });
  return rows.map(mapApiRowToUiModel);
}

export function normalizeSchedulerInput(item) {
  return normalizeContentRecord(item);
}

export async function createCampaignRecord(campaign, { signal } = {}) {
  return apiRequest('/campaigns', {
    method: 'POST',
    signal,
    body: campaign,
  });
}

export async function updateCampaignRecord(campaignId, campaign, { signal } = {}) {
  const row = await apiRequest(`/campaigns/${campaignId}`, {
    method: 'PUT',
    signal,
    body: campaign,
  });
  return mapApiRowToUiModel(row);
}

export async function deleteCampaignRecord(campaignId, { signal } = {}) {
  await apiRequest(`/campaigns/${campaignId}`, {
    method: 'DELETE',
    signal,
  });
}

export function validateCampaignContract(campaign) {
  const errors = [];
  const warnings = [];

  if (!campaign || typeof campaign !== 'object') {
    return {
      isValid: false,
      errors: ['Campaign payload must be an object'],
      warnings,
    };
  }

  if (!String(campaign.name || '').trim()) {
    errors.push('name is required');
  }

  const allowedStatuses = ['draft', 'active', 'paused', 'completed'];
  if (campaign.status && !allowedStatuses.includes(campaign.status)) {
    errors.push('status must be draft, active, paused, or completed');
  }

  const affiliateProduct = campaign.affiliate_product || {};
  if (!String(affiliateProduct.product_id || '').trim()) {
    errors.push('affiliate_product.product_id is required');
  }
  if (!String(affiliateProduct.vendor || '').trim()) {
    errors.push('affiliate_product.vendor is required');
  }
  if (!String(affiliateProduct.offer_name || '').trim()) {
    errors.push('affiliate_product.offer_name is required');
  }
  if (!String(affiliateProduct.hoplink || '').trim()) {
    errors.push('affiliate_product.hoplink is required');
  }
  if (!affiliateProduct.commission || typeof affiliateProduct.commission !== 'object') {
    errors.push('affiliate_product.commission is required');
  }

  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms : [];
  const hasInvalidPlatform = platforms.some((platform) => !String(platform || '').trim());
  if (hasInvalidPlatform) {
    errors.push('platforms must contain non-empty strings');
  }

  const pieces = Array.isArray(campaign.content_pieces) ? campaign.content_pieces : [];
  if (!pieces.length) {
    warnings.push('Campaign has no content_pieces. Scheduler record will use fallback text.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function mapCampaignToSchedulerInput(campaign, { pieceIndex = 0, campaignId = null } = {}) {
  const pieces = Array.isArray(campaign?.content_pieces) ? campaign.content_pieces : [];
  const piece = pieces[pieceIndex] || null;
  const pieceSchedule = piece?.schedule || {};
  const publishAt = parseIsoDateTime(pieceSchedule.publish_at);

  const description =
    piece?.copy?.body ||
    piece?.copy?.caption ||
    piece?.copy?.script ||
    campaign?.notes ||
    '';

  const piecePlatforms = Array.isArray(piece?.platform)
    ? piece.platform
    : (piece?.platform ? [piece.platform] : []);
  const platforms = piecePlatforms.length
    ? piecePlatforms
    : (Array.isArray(campaign?.platforms) ? campaign.platforms : []);

  const costValue = campaign?.metrics?.intent?.budget?.amount;

  return normalizeContentRecord({
    campaign_id: campaignId,
    title: String(campaign?.name || 'Untitled Campaign').trim(),
    description: String(description || '').trim(),
    sendDate: publishAt?.date || '',
    sendTime: publishAt?.time || '',
    recurrence: pieceSchedule.recurrence || campaign?.scheduling?.campaign_window?.cadence_default || 'once',
    endDate: parseIsoDateTime(pieceSchedule.end_at)?.date || '',
    platforms,
    cost: costValue ?? '',
    color: campaign?.theme_color || null,
  });
}

export function mapSchedulerCardToCampaignPayload(item, { campaignId = null, used = false, startDate = null, endDate = null } = {}) {
  const campaign = item?._campaign || item || {};
  const existingScheduling = campaign.scheduling || {};
  const existingWindow = existingScheduling.campaign_window || {};
  const currentPiece = Array.isArray(campaign.content_pieces) ? campaign.content_pieces[0] : null;
  const currentSchedule = currentPiece?.schedule || {};

  const hasStartDateOverride = startDate !== null;
  const hasEndDateOverride = endDate !== null;
  const normalizedStartDate = hasStartDateOverride ? startDate : (item.sendDate || null);
  const normalizedEndDate = hasEndDateOverride ? endDate : (item.endDate || null);
  const nextSendTime = item.sendTime || '09:00';

  return {
    ...campaign,
    id: campaignId || campaign.id,
    is_used: used,
    theme_color: item.color || campaign.theme_color || null,
    status: campaign.status || 'draft',
    scheduling: {
      ...existingScheduling,
      campaign_window: {
        ...existingWindow,
        start_at: hasStartDateOverride
          ? (normalizedStartDate ? `${normalizedStartDate}T${nextSendTime}:00` : null)
          : (existingWindow.start_at || null),
        end_at: hasEndDateOverride
          ? (normalizedEndDate ? `${normalizedEndDate}T23:59:59` : null)
          : (existingWindow.end_at || null),
        cadence_default: item.recurrence || currentSchedule.recurrence || existingWindow.cadence_default || 'once',
      },
    },
    content_pieces: Array.isArray(campaign.content_pieces)
      ? campaign.content_pieces.map((piece, index) => index === 0 ? ({
          ...piece,
          schedule: {
            ...piece.schedule,
            publish_at: hasStartDateOverride
              ? (normalizedStartDate ? `${normalizedStartDate}T${nextSendTime}:00` : null)
              : (piece.schedule?.publish_at || null),
            recurrence: item.recurrence || piece.schedule?.recurrence || 'once',
            end_at: hasEndDateOverride
              ? (normalizedEndDate ? `${normalizedEndDate}T23:59:59` : null)
              : (piece.schedule?.end_at || null),
          },
        }) : piece)
      : campaign.content_pieces || [],
  };
}

export async function createCampaignForScheduler(campaign, { strict = true, signal } = {}) {
  const validation = validateCampaignContract(campaign);
  if (!validation.isValid && strict) {
    throw new Error(`Campaign contract validation failed: ${validation.errors.join('; ')}`);
  }

  const campaignPayload = {
    ...campaign,
    is_used: false,
  };

  const savedCampaign = await createCampaignRecord(campaignPayload, { signal });

  return {
    campaign: savedCampaign,
    item: mapApiRowToUiModel(savedCampaign),
    errors: validation.errors,
    warnings: validation.warnings,
  };
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
    let message = 'Scheduler request failed';

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

function normalizeContentRecord(item) {
  const recurrence = item?.recurrence || item?.interval || SCHEDULER_DEFAULTS.recurrence;

  return {
    id: item?.id ?? SCHEDULER_DEFAULTS.id,
    campaign_id: item?.campaign_id ?? null,
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
    isUsed: Boolean(item?.isUsed),
  };
}

function mapApiRowToUiModel(row) {
  const campaign = row || {};
  const primaryPiece = Array.isArray(campaign.content_pieces) ? campaign.content_pieces[0] : null;
  const schedule = primaryPiece?.schedule || campaign.scheduling?.campaign_window || {};
  const publishAt = parseIsoDateTime(schedule.publish_at);

  const normalized = normalizeContentRecord({
    id: campaign?.id,
    campaign_id: campaign?.id,
    title: campaign?.name,
    description: primaryPiece?.copy?.body || primaryPiece?.copy?.caption || campaign?.notes || '',
    sendDate: campaign?.is_used ? (publishAt?.date || '') : '',
    sendTime: campaign?.is_used ? (publishAt?.time || '') : '',
    recurrence: primaryPiece?.schedule?.recurrence || campaign?.scheduling?.campaign_window?.cadence_default || 'once',
    endDate: parseIsoDateTime(primaryPiece?.schedule?.end_at || campaign?.scheduling?.campaign_window?.end_at)?.date || '',
    platforms: campaign?.platforms,
    cost: campaign?.metrics?.intent?.budget?.amount,
    color: campaign?.theme_color || '#00C896',
    isUsed: !!campaign?.is_used,
  });
  
  normalized._raw = campaign;
  normalized._campaign = campaign;
  
  return normalized;
}

function mapUiModelToApiPayload(item) {
  const normalized = normalizeContentRecord(item);
  return {
    name: normalized.title,
    campaign_id: normalized.campaign_id || item.campaign_id || item._campaignId || null,
    start_date: normalized.sendDate || null,
    end_date: normalized.endDate || null,
    send_time: normalized.sendTime || null,
    interval: normalized.recurrence,
    platforms: normalized.platforms,
    cost: normalized.cost ? String(normalized.cost) : null,
    color: normalized.color,
  };
}

function parseIsoDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}
