import { NextFunction, Request, Response } from "express";
import { ensureWorkspace } from "../models/mockStore";

export async function workspaceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawWorkspaceId = req.header("x-workspace-id");

  if (!rawWorkspaceId) {
    res.status(400).json({ error: "Missing x-workspace-id header" });
    return;
  }

  const externalId = rawWorkspaceId.trim();

  try {
    const workspace = ensureWorkspace(externalId);
    req.workspaceId = workspace.id;
    req.workspace = workspace;
    next();
  } catch (error) {
    next(error);
  }
}
