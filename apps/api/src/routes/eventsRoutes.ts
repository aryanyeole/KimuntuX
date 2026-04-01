import { Router } from "express";
import { trackLeadEvent, trackPixelEvent } from "../controllers/eventsController";

const router = Router();

router.post("/events/lead", trackLeadEvent);
router.post("/events/pixel", trackPixelEvent);

export default router;
