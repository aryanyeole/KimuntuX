import { Request, Response } from "express";
import { leads, activities } from "../models/mockStore";
import { PipelineStage } from "../models/PipelineStage";

export function getDashboardSummary(_req: Request, res: Response): void {
  const totalLeads = leads.length;

  const hotLeads = leads.filter((l) => l.score === "HOT").length;
  const warmLeads = leads.filter((l) => l.score === "WARM").length;
  const coldLeads = leads.filter((l) => l.score === "COLD").length;

  const leadsByStage: Record<string, number> = {};
  for (const stage of Object.values(PipelineStage)) {
    leadsByStage[stage] = leads.filter((l) => l.stage === stage).length;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivities = activities.filter(
    (a) => new Date(a.createdAt) >= sevenDaysAgo
  ).length;

  res.json({
    totalLeads,
    hotLeads,
    warmLeads,
    coldLeads,
    leadsByStage,
    recentActivities,
  });
}
