import { Router } from "express";
import { scoreLead, generateEmailDraft } from "../controllers/aiController";

const router = Router();

router.post("/ai/score/:id", scoreLead);
router.post("/ai/draft-email/:leadId", generateEmailDraft);

export default router;
