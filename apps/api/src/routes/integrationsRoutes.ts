import { Router } from "express";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrations,
  scanGmail,
  sendTrackingTestEvent,
  syncGoogleSheets,
} from "../controllers/integrationsController";

const router = Router();

router.get("/integrations", getIntegrations);
router.post("/integrations/:provider/connect", connectIntegration);
router.post("/integrations/:provider/disconnect", disconnectIntegration);
router.post("/integrations/google/sheets/sync", syncGoogleSheets);
router.post("/integrations/google/gmail/scan", scanGmail);
router.post("/integrations/tracking/test", sendTrackingTestEvent);

export default router;
