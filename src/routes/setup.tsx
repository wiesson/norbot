import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthWithUser } from "@/lib/route-auth";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const Route = createFileRoute("/setup")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === "string" ? search.step : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    const { user } = await requireAuthWithUser(context);

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
