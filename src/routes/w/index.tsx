import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/w/")({
  component: WorkspaceRedirect,
});

function WorkspaceRedirect() {
  const { data: user } = useConvexQuery(api.authFunctions.currentUser, {});

  if (user === undefined) return null;

  if (user?.workspaces?.length) {
    const workspaceId = user.workspaces[0]._id;
    return <Navigate to="/w/$workspaceId" params={{ workspaceId }} />;
  }

  return <Navigate to="/onboarding" />;
}
