import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthWithUser } from "@/lib/route-auth";
import { WaitingRoom } from "@/components/waiting-room";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    const { user } = await requireAuthWithUser(context);

    if (user.workspaces?.length) {
      const slug = user.workspaces[0].slug;
      throw redirect({
        to: "/w/$slug",
        params: { slug },
      });
    }

    return { user };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = Route.useRouteContext();
  return <WaitingRoom user={user} />;
}
