import { PipelineStage } from "./PipelineStage";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  stage: PipelineStage;
  score: "HOT" | "WARM" | "COLD";
  createdAt: Date;
}
