import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-auth";
import { NewWorkspaceRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/workspaces/new")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: NewWorkspaceRouteView,
});
