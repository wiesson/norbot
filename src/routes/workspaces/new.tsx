import { createFileRoute } from "@tanstack/react-router";
import { requireServerSession } from "@/lib/route-auth";
import { NewWorkspaceRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/workspaces/new")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: NewWorkspaceRouteView,
});
