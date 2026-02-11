import express from "express";
import cors from "cors";
import leadsRoutes from "./routes/leadsRoutes";
import aiRoutes from "./routes/aiRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { seedMockLeads } from "./models/mockStore";

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

seedMockLeads();

app.listen(PORT, () => {
  console.log(`CRM API running on port ${PORT}`);
});
