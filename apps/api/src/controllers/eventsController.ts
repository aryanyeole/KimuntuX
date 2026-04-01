import { Request, Response } from "express";
import {
  createMockRunLog,
  ensureIntegrationExists,
  findOrUpdateLeadByEmail,
  platformEvents,
} from "../models/mockStore";
import { PipelineStage } from "../models/PipelineStage";

type LeadEventBody = {
  externalId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source?: string;
  occurredAt?: string;
  payload?: Record<string, unknown>;
};

type PixelEventBody = {
  externalId?: string;
  leadId?: string;
  email?: string;
  name?: string;
  source?: string;
  occurredAt?: string;
  payload?: Record<string, unknown>;
};

function parseOccurredAt(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function trackLeadEvent(req: Request, res: Response): Promise<void> {
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    res.status(500).json({ error: "Workspace context missing" });
    return;
  }

  const body = req.body as LeadEventBody;

  if (!body.email && !body.externalId) {
    res.status(400).json({ error: "Lead event requires email or externalId" });
    return;
  }

  const integration = ensureIntegrationExists(workspaceId, "tracking", {
    name: "Tracking",
    status: "connected",
    connectedAt: new Date(),
  });

  const fallbackEmail = body.email ?? `${body.externalId}@tracking.local`;
  const name = [body.firstName, body.lastName].filter(Boolean).join(" ").trim() || "Tracked Lead";

  const lead = findOrUpdateLeadByEmail(fallbackEmail, {
    name,
    company: body.company,
    workspaceId,
    source: body.source ?? "tracking",
    stage: PipelineStage.NEW,
    score: "COLD",
  });

  const event = {
    id: `${lead.id}-lead-event-${Date.now()}`,
    workspaceId,
    integrationId: integration.id,
    type: "lead" as const,
    source: body.source ?? "tracking",
    leadId: lead.id,
    email: lead.email,
    name: lead.name,
    payload: {
      externalId: body.externalId,
      occurredAt: parseOccurredAt(body.occurredAt).toISOString(),
      ...(body.payload ?? req.body),
    },
    createdAt: parseOccurredAt(body.occurredAt),
  };

  platformEvents.unshift(event);
  integration.lastSyncAt = new Date();
  integration.updatedAt = new Date();

  const run = createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider: "tracking",
    action: "lead_event",
    message: `Lead event processed for ${lead.email}`,
    metadata: {
      leadId: lead.id,
      eventId: event.id,
    },
  });

  res.status(201).json({ success: true, lead, event, run, integration });
}

export async function trackPixelEvent(req: Request, res: Response): Promise<void> {
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    res.status(500).json({ error: "Workspace context missing" });
    return;
  }

  const body = req.body as PixelEventBody;
  const integration = ensureIntegrationExists(workspaceId, "tracking", {
    name: "Tracking",
    status: "connected",
    connectedAt: new Date(),
  });

  const event = {
    id: `pixel-event-${Date.now()}`,
    workspaceId,
    integrationId: integration.id,
    type: "pixel" as const,
    source: body.source ?? "tracking",
    leadId: body.leadId,
    email: body.email,
    name: body.name,
    payload: {
      externalId: body.externalId,
      occurredAt: parseOccurredAt(body.occurredAt).toISOString(),
      ...(body.payload ?? req.body),
    },
    createdAt: parseOccurredAt(body.occurredAt),
  };

  platformEvents.unshift(event);
  integration.lastSyncAt = new Date();
  integration.updatedAt = new Date();

  const run = createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider: "tracking",
    action: "pixel_event",
    message: "Pixel event recorded",
    metadata: {
      eventId: event.id,
    },
  });

  res.status(201).json({ success: true, event, run, integration });
}
