import { PipelineStage } from "./PipelineStage";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  workspaceId?: string;
  source?: string;
  stage: PipelineStage;
  score: "HOT" | "WARM" | "COLD";
  createdAt: Date;
  updatedAt?: Date;
}
