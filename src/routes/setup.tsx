import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth, getViewer } from "@/lib/route-auth";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const Route = createFileRoute("/setup")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === "string" ? search.step : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    requireAuth(context);

    const user = await getViewer();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (!user.workspaces?.length && !user.isApproved) {
      throw redirect({ to: "/waiting" });
    }

    if (user.onboarding?.completedAt && !search.step) {
      throw redirect({ to: "/app" });
    }

    return { user };
  },
  component: SetupPage,
});

function SetupPage() {
  const { user } = Route.useRouteContext();
  return <SetupWizard user={user} />;
}
