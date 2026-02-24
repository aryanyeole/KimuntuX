import { Lead } from "./Lead";
import { LeadActivity } from "./LeadActivity";
import { PipelineStage } from "./PipelineStage";

export const leads: Lead[] = [];
export const activities: LeadActivity[] = [];

export function seedMockLeads(): void {
  leads.length = 0;

  leads.push(
    {
      id: "lead-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      company: "Acme Corp",
      stage: PipelineStage.NEW,
      score: "HOT",
      createdAt: new Date("2026-01-15"),
    },
    {
      id: "lead-2",
      name: "Bob Smith",
      email: "bob@example.com",
      company: "Globex Inc",
      stage: PipelineStage.CONTACTED,
      score: "WARM",
      createdAt: new Date("2026-01-20"),
    },
    {
      id: "lead-3",
      name: "Carol Lee",
      email: "carol@example.com",
      stage: PipelineStage.ENGAGED,
      score: "HOT",
      createdAt: new Date("2026-02-01"),
    },
    {
      id: "lead-4",
      name: "Dave Kim",
      email: "dave@example.com",
      company: "Initech",
      stage: PipelineStage.PROPOSAL_SENT,
      score: "WARM",
      createdAt: new Date("2026-02-05"),
    },
    {
      id: "lead-5",
      name: "Eve Martinez",
      email: "eve@example.com",
      company: "Umbrella LLC",
      stage: PipelineStage.WON,
      score: "COLD",
      createdAt: new Date("2026-02-10"),
    }
  );
}
