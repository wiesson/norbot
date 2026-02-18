import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth, ensureViewer } from "@/lib/route-auth";
import { WaitingRoom } from "@/components/waiting-room";

export const Route = createFileRoute("/waiting")({
  beforeLoad: async ({ context }) => {
    requireAuth(context);

    const user = await ensureViewer();

    if (!user) {
      throw redirect({ to: "/login", search: { redirect: undefined } });
    }

    if (user.workspaces?.length) {
      throw redirect({ to: "/app" });
    }

    if (user.isApproved) {
      throw redirect({ to: "/setup", search: { step: undefined } });
    }

    return { user };
  },
  component: WaitingPage,
});

function WaitingPage() {
  const { user } = Route.useRouteContext();
  return <WaitingRoom user={user} />;
}
