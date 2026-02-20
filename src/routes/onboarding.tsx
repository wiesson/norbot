import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth, ensureViewer } from "@/lib/route-auth";
import { WaitingRoom } from "@/components/waiting-room";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    requireAuth(context);
    const user = await ensureViewer();

    if (user?.workspaces?.length) {
      const slug = user.workspaces[0].slug;
      throw redirect({ to: "/w/$slug", params: { slug } });
    }

    if (user?.isApproved) {
      throw redirect({ to: "/setup", search: { step: undefined } });
    }

    return { user };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = Route.useRouteContext();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Setting up your account...</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return <WaitingRoom user={user} />;
}
