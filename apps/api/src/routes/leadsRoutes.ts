import { Router } from "express";
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLeadStage,
  getLeadActivities,
} from "../controllers/leadsController";

const router = Router();

router.get("/leads", getAllLeads);
router.get("/leads/:id", getLeadById);
router.post("/leads", createLead);
router.patch("/leads/:id/stage", updateLeadStage);
router.get("/leads/:id/activity", getLeadActivities);

export default router;
