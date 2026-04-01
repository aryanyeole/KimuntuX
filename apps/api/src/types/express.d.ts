import type { MockWorkspace } from "../models/mockStore";

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      workspace?: MockWorkspace;
    }
  }
}

export {};
