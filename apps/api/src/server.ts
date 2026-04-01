import express from "express";
import cors from "cors";
import leadsRoutes from "./routes/leadsRoutes";
import aiRoutes from "./routes/aiRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import integrationsRoutes from "./routes/integrationsRoutes";
import eventsRoutes from "./routes/eventsRoutes";
import { seedMockLeads } from "./models/mockStore";
import { workspaceMiddleware } from "./middleware/workspaceMiddleware";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", leadsRoutes);
app.use("/api", aiRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", workspaceMiddleware, integrationsRoutes);
app.use("/api", workspaceMiddleware, eventsRoutes);

seedMockLeads();

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`CRM API running on port ${PORT}`);
});
