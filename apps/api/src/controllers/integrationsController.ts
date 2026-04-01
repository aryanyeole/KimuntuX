import { Request, Response } from "express";
import {
  createMockRunLog,
  ensureIntegrationExists,
  findOrUpdateLeadByEmail,
  integrationRuns,
  integrations,
  platformEvents,
} from "../models/mockStore";
import { PipelineStage } from "../models/PipelineStage";

function getWorkspaceContext(req: Request, res: Response): string | null {
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    res.status(500).json({ error: "Workspace context missing" });
    return null;
  }

  return workspaceId;
}

function getProviderLabel(provider: string): string {
  const normalized = provider.toLowerCase();
  if (normalized === "google") {
    return "Google";
  }
  if (normalized === "tracking") {
    return "Tracking";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function buildApiKey(provider: string): string {
  const prefix = provider.toUpperCase().slice(0, 5);
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getDashboardPayload(workspaceId: string, req: Request) {
  const workspaceIntegrations = integrations.filter(
    (integration) => integration.workspaceId === workspaceId
  );
  const recentRuns = integrationRuns
    .filter((run) => run.workspaceId === workspaceId)
    .slice(0, 10);
  const recentEvents = platformEvents
    .filter((event) => event.workspaceId === workspaceId)
    .slice(0, 10);

  return {
    workspace: req.workspace,
    integrations: workspaceIntegrations,
    recentRuns,
    recentEvents,
  };
}

export async function getIntegrations(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  ensureIntegrationExists(workspaceId, "google", {
    name: "Google",
    config: {
      features: ["Sheets import", "Gmail scan"],
    },
  });

  ensureIntegrationExists(workspaceId, "tracking", {
    name: "Tracking",
    config: {
      eventEndpoints: ["/api/events/lead", "/api/events/pixel"],
    },
  });

  res.json({
    success: true,
    workspace: req.workspace,
    integrations: integrations.filter(
      (integration) => integration.workspaceId === workspaceId
    ),
    recentRuns: integrationRuns
      .filter((run) => run.workspaceId === workspaceId)
      .slice(0, 10),
    recentEvents: platformEvents
      .filter((event) => event.workspaceId === workspaceId)
      .slice(0, 10),
  });
}

export async function connectIntegration(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  const provider = req.params.provider.toLowerCase();
  const integration = ensureIntegrationExists(workspaceId, provider, {
    name: getProviderLabel(provider),
    status: "connected",
    connectedAt: new Date(),
  });

  if (provider === "tracking" && !integration.apiKey) {
    integration.apiKey = buildApiKey(provider);
  }

  createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider,
    action: "connect",
    message: `${integration.name} connected`,
    metadata: {
      connectedAt: integration.connectedAt?.toISOString(),
    },
  });

  res.json({
    success: true,
    message: `${integration.name} connected`,
    integration,
    ...getDashboardPayload(workspaceId, req),
  });
}

export async function disconnectIntegration(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  const provider = req.params.provider.toLowerCase();
  const integration = ensureIntegrationExists(workspaceId, provider, {
    name: getProviderLabel(provider),
  });

  integration.status = "disconnected";
  integration.updatedAt = new Date();

  createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider,
    action: "disconnect",
    message: `${integration.name} disconnected`,
  });

  res.json({
    success: true,
    message: `${integration.name} disconnected`,
    integration,
    ...getDashboardPayload(workspaceId, req),
  });
}

export async function syncGoogleSheets(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  const integration = ensureIntegrationExists(workspaceId, "google", {
    name: "Google",
    status: "connected",
    connectedAt: new Date(),
  });

  const importCount = 3 + Math.floor(Math.random() * 3);
  const importedLeads = Array.from({ length: importCount }, (_, index) => {
    const email = `sheets-lead-${Date.now()}-${index}@example.com`;
    return findOrUpdateLeadByEmail(email, {
      name: `Sheets Lead ${index + 1}`,
      company: `Demo Company ${index + 1}`,
      workspaceId,
      source: "google-sheets",
      stage: PipelineStage.NEW,
      score: "COLD",
    });
  });

  integration.lastSyncAt = new Date();
  integration.updatedAt = new Date();

  const run = createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider: "google",
    action: "sheets_sync",
    message: `Imported ${importedLeads.length} leads from Google Sheets`,
    metadata: {
      importedCount: importedLeads.length,
    },
  });

  res.json({
    success: true,
    message: `Imported ${importedLeads.length} leads from Google Sheets`,
    integration,
    run,
    importedCount: importedLeads.length,
    leads: importedLeads,
    ...getDashboardPayload(workspaceId, req),
  });
}

export async function scanGmail(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  const integration = ensureIntegrationExists(workspaceId, "google", {
    name: "Google",
    status: "connected",
    connectedAt: new Date(),
  });

  const scanCount = 2 + Math.floor(Math.random() * 3);
  const discoveredLeads = Array.from({ length: scanCount }, (_, index) => {
    const email = `gmail-lead-${Date.now()}-${index}@example.com`;
    const lead = findOrUpdateLeadByEmail(email, {
      name: `Gmail Prospect ${index + 1}`,
      company: `Inbox Company ${index + 1}`,
      workspaceId,
      source: "gmail-scan",
      stage: PipelineStage.CONTACTED,
      score: "WARM",
    });

    platformEvents.unshift({
      id: `${lead.id}-gmail-${Date.now()}-${index}`,
      workspaceId,
      integrationId: integration.id,
      type: "lead",
      source: "gmail",
      leadId: lead.id,
      email: lead.email,
      name: lead.name,
      payload: {
        subject: `Interested in KimuntuX ${index + 1}`,
        provider: "gmail",
      },
      createdAt: new Date(),
    });

    return lead;
  });

  integration.lastSyncAt = new Date();
  integration.updatedAt = new Date();

  const run = createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider: "google",
    action: "gmail_scan",
    message: `Scanned Gmail and created ${discoveredLeads.length} leads`,
    metadata: {
      discoveredCount: discoveredLeads.length,
    },
  });

  res.json({
    success: true,
    message: `Scanned Gmail and created ${discoveredLeads.length} leads`,
    integration,
    run,
    discoveredCount: discoveredLeads.length,
    leads: discoveredLeads,
    ...getDashboardPayload(workspaceId, req),
  });
}

export async function sendTrackingTestEvent(req: Request, res: Response): Promise<void> {
  const workspaceId = getWorkspaceContext(req, res);
  if (!workspaceId) {
    return;
  }

  const integration = ensureIntegrationExists(workspaceId, "tracking", {
    name: "Tracking",
    status: "connected",
    connectedAt: new Date(),
  });

  if (!integration.apiKey) {
    integration.apiKey = buildApiKey("tracking");
  }

  const lead = findOrUpdateLeadByEmail("tracking.demo@example.com", {
    name: "Tracking Demo",
    company: "Kimux Demo Co",
    workspaceId,
    source: "tracking_test",
    stage: PipelineStage.NEW,
    score: "COLD",
  });

  integration.lastSyncAt = new Date();
  integration.updatedAt = new Date();

  const event = {
    id: `tracking-test-${Date.now()}`,
    workspaceId,
    integrationId: integration.id,
    type: "lead" as const,
    source: "tracking-test",
    leadId: lead.id,
    email: lead.email,
    name: lead.name,
    payload: {
      email: "tracking.demo@example.com",
      firstName: "Tracking",
      lastName: "Demo",
      company: "Kimux Demo Co",
      source: "tracking_test",
      provider: "tracking",
    },
    createdAt: new Date(),
  };

  platformEvents.unshift(event);

  const run = createMockRunLog({
    workspaceId,
    integrationId: integration.id,
    provider: "tracking",
    action: "test_event",
    message: `Tracking test lead event sent for ${lead.email}`,
    metadata: {
      eventId: event.id,
      leadId: lead.id,
    },
  });

  res.json({
    success: true,
    message: "Tracking test lead event sent",
    integration,
    lead,
    run,
    event,
    ...getDashboardPayload(workspaceId, req),
  });
}
