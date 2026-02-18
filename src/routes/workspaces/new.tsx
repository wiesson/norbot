import { createFileRoute } from "@tanstack/react-router";
import { requireAuthWithUser } from "@/lib/route-auth";
import { NewWorkspaceRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/workspaces/new")({
  beforeLoad: async ({ context }) => {
    return await requireAuthWithUser(context);
  },
  component: NewWorkspacePage,
});

function NewWorkspacePage() {
  const { user } = Route.useRouteContext();
  return <NewWorkspaceRouteView user={user} />;
}
