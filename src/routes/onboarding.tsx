import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";
import { WaitingRoom } from "@/components/waiting-room";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: undefined } });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { data: user } = useConvexQuery(api.authFunctions.currentUser, {});

  if (user === undefined) return null;

  if (user?.workspaces?.length) {
    return <Navigate to="/w" />;
  }

  if (!user) {
    return null;
  }

  return <WaitingRoom user={user} />;
}
