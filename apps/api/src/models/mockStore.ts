import { v4 as uuidv4 } from "uuid";
import { Lead } from "./Lead";
import { LeadActivity } from "./LeadActivity";
import { PipelineStage } from "./PipelineStage";

export const leads: Lead[] = [];
export const activities: LeadActivity[] = [];
export const workspaces: MockWorkspace[] = [];
export const integrations: MockIntegration[] = [];
export const integrationRuns: MockIntegrationRun[] = [];
export const platformEvents: MockPlatformEvent[] = [];

export interface MockWorkspace {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockIntegration {
  id: string;
  workspaceId: string;
  provider: string;
  name: string;
  status: "connected" | "disconnected";
  apiKey?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockIntegrationRun {
  id: string;
  workspaceId: string;
  integrationId: string;
  provider: string;
  action: string;
  status: "success" | "failed";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface MockPlatformEvent {
  id: string;
  workspaceId: string;
  integrationId?: string;
  type: "lead" | "pixel";
  source: string;
  leadId?: string;
  email?: string;
  name?: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

function toSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

export function ensureWorkspace(externalId: string): MockWorkspace {
  const normalizedExternalId = externalId.trim();
  let workspace = workspaces.find((item) => item.externalId === normalizedExternalId);

  if (!workspace) {
    workspace = {
      id: uuidv4(),
      externalId: normalizedExternalId,
      name: normalizedExternalId,
      slug: `${toSlug(normalizedExternalId)}-${normalizedExternalId
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    workspaces.push(workspace);
  }

  workspace.updatedAt = new Date();
  return workspace;
}

export function ensureIntegrationExists(
  workspaceId: string,
  provider: string,
  overrides?: Partial<Omit<MockIntegration, "id" | "workspaceId" | "provider" | "createdAt" | "updatedAt">>
): MockIntegration {
  const normalizedProvider = provider.toLowerCase();
  let integration = integrations.find(
    (item) => item.workspaceId === workspaceId && item.provider === normalizedProvider
  );

  if (!integration) {
    integration = {
      id: uuidv4(),
      workspaceId,
      provider: normalizedProvider,
      name: normalizedProvider === "google" ? "Google" : normalizedProvider === "tracking" ? "Tracking" : normalizedProvider,
      status: "disconnected",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
    integrations.push(integration);
  } else if (overrides) {
    Object.assign(integration, overrides);
    integration.updatedAt = new Date();
  }

  return integration;
}

export function findLeadByEmail(email: string): Lead | undefined {
  return leads.find((lead) => lead.email.toLowerCase() === email.toLowerCase());
}

export function findOrUpdateLeadByEmail(
  email: string,
  updates: Partial<Lead> & Pick<Lead, "name">
): Lead {
  const existingLead = findLeadByEmail(email);

  if (existingLead) {
    existingLead.name = updates.name ?? existingLead.name;
    existingLead.company = updates.company ?? existingLead.company;
    existingLead.stage = updates.stage ?? existingLead.stage;
    existingLead.score = updates.score ?? existingLead.score;
    existingLead.workspaceId = updates.workspaceId ?? existingLead.workspaceId;
    existingLead.source = updates.source ?? existingLead.source;
    existingLead.updatedAt = new Date();
    return existingLead;
  }

  const newLead: Lead = {
    id: uuidv4(),
    name: updates.name,
    email,
    company: updates.company,
    workspaceId: updates.workspaceId,
    source: updates.source,
    stage: updates.stage ?? PipelineStage.NEW,
    score: updates.score ?? "COLD",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  leads.push(newLead);
  return newLead;
}

export function createMockRunLog(params: {
  workspaceId: string;
  integrationId: string;
  provider: string;
  action: string;
  status?: "success" | "failed";
  message: string;
  metadata?: Record<string, unknown>;
}): MockIntegrationRun {
  const run: MockIntegrationRun = {
    id: uuidv4(),
    workspaceId: params.workspaceId,
    integrationId: params.integrationId,
    provider: params.provider,
    action: params.action,
    status: params.status ?? "success",
    message: params.message,
    metadata: params.metadata,
    createdAt: new Date(),
  };

  integrationRuns.unshift(run);
  return run;
}

export function seedMockLeads(): void {
  leads.length = 0;

  leads.push(
    {
      id: "lead-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      company: "Acme Corp",
      workspaceId: "demo-workspace",
      source: "seed",
      stage: PipelineStage.NEW,
      score: "HOT",
      createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    },
    {
      id: "lead-2",
      name: "Bob Smith",
      email: "bob@example.com",
      company: "Globex Inc",
      workspaceId: "demo-workspace",
      source: "seed",
      stage: PipelineStage.CONTACTED,
      score: "WARM",
      createdAt: new Date("2026-01-20"),
      updatedAt: new Date("2026-01-20"),
    },
    {
      id: "lead-3",
      name: "Carol Lee",
      email: "carol@example.com",
      workspaceId: "demo-workspace",
      source: "seed",
      stage: PipelineStage.ENGAGED,
      score: "HOT",
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
    },
    {
      id: "lead-4",
      name: "Dave Kim",
      email: "dave@example.com",
      company: "Initech",
      workspaceId: "demo-workspace",
      source: "seed",
      stage: PipelineStage.PROPOSAL_SENT,
      score: "WARM",
      createdAt: new Date("2026-02-05"),
      updatedAt: new Date("2026-02-05"),
    },
    {
      id: "lead-5",
      name: "Eve Martinez",
      email: "eve@example.com",
      company: "Umbrella LLC",
      workspaceId: "demo-workspace",
      source: "seed",
      stage: PipelineStage.WON,
      score: "COLD",
      createdAt: new Date("2026-02-10"),
      updatedAt: new Date("2026-02-10"),
    }
  );
}
