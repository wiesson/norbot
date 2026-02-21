import { createContext, useContext } from "react";
import type { Id, Doc } from "@convex/_generated/dataModel";

interface WorkspaceContextValue {
  workspaceId: Id<"workspaces">;
  workspace: Doc<"workspaces">;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useWorkspace must be used within a WorkspaceContext provider (inside $workspaceId layout)",
    );
  }
  return ctx;
}
