import { createFileRoute, redirect } from "@tanstack/react-router";
import { getViewer, requireAuth } from "@/lib/route-auth";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context }) => {
    requireAuth(context);

    const user = await getViewer();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (!user.workspaces?.length) {
      throw redirect({ to: "/waiting" });
    }
    if (!user.onboarding?.completedAt) {
      throw redirect({ to: "/setup", search: { step: undefined } });
    }

    return { user };
  },
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  return <Dashboard user={user} />;
}
