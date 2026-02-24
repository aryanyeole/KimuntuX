import { Request, Response } from "express";
import { leads } from "../models/mockStore";
import { PipelineStage } from "../models/PipelineStage";

export function scoreLead(req: Request, res: Response): void {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  if (
    lead.stage === PipelineStage.ENGAGED ||
    lead.stage === PipelineStage.PROPOSAL_SENT
  ) {
    lead.score = "HOT";
  } else if (lead.stage === PipelineStage.CONTACTED) {
    lead.score = "WARM";
  } else {
    lead.score = "COLD";
  }

  res.json({
    leadId: lead.id,
    score: lead.score,
    reason: "Generated based on pipeline stage",
  });
}

export function generateEmailDraft(req: Request, res: Response): void {
  const lead = leads.find((l) => l.id === req.params.leadId);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const subject = lead.company
    ? `Quick follow-up for ${lead.company}`
    : "Quick follow-up";

  const stageLabel = lead.stage.replace(/_/g, " ").toLowerCase();

  let body = `Hi ${lead.name},\n\n`;

  if (lead.company) {
    body += `I wanted to reach out regarding ${lead.company} and how we can support your goals. `;
  } else {
    body += `I wanted to reach out and see how we can support your goals. `;
  }

  body += `I see you're currently in the ${stageLabel} stage, and I'd love to keep the conversation moving forward.\n\n`;
  body += `Would you be open to a quick 10-minute call this week?`;

  res.json({ leadId: lead.id, subject, body });
}
