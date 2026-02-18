import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthWithUser } from "@/lib/route-auth";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context }) => {
    const { user } = await requireAuthWithUser(context);

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
