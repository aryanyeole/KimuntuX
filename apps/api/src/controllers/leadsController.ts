import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { leads, activities } from "../models/mockStore";
import { Lead } from "../models/Lead";
import { LeadActivity } from "../models/LeadActivity";
import { PipelineStage } from "../models/PipelineStage";

export function getAllLeads(_req: Request, res: Response): void {
  res.json(leads);
}

export function getLeadById(req: Request, res: Response): void {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
}

export function createLead(req: Request, res: Response): void {
  const { name, email, company } = req.body as {
    name: string;
    email: string;
    company?: string;
  };

  const newLead: Lead = {
    id: uuidv4(),
    name,
    email,
    company,
    stage: PipelineStage.NEW,
    score: "COLD",
    createdAt: new Date(),
  };

  leads.push(newLead);
  res.status(201).json(newLead);
}

export function updateLeadStage(req: Request, res: Response): void {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const { stage } = req.body as { stage: string };

  if (!Object.values(PipelineStage).includes(stage as PipelineStage)) {
    res.status(400).json({ error: "Invalid pipeline stage" });
    return;
  }

  lead.stage = stage as PipelineStage;

  const activity: LeadActivity = {
    id: uuidv4(),
    leadId: lead.id,
    type: "STAGE_CHANGE",
    message: `Stage updated to ${stage}`,
    createdAt: new Date(),
  };

  activities.push(activity);
  res.json(lead);
}

export function getLeadActivities(req: Request, res: Response): void {
  const leadId = req.params.id;
  const leadExists = leads.some((l) => l.id === leadId);
  if (!leadExists) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const leadActivities = activities.filter((a) => a.leadId === leadId);
  res.json(leadActivities);
}
