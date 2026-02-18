import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { Dashboard } from "@/components/dashboard";
import LoginPage from "@/views/landing-page";

const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.auth.viewer, {});
});

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) return;

    const user = await getViewer();

    if (!user) return;

    if (!user.workspaces?.length) {
      throw redirect({ to: "/waiting" });
    }
    if (!user.onboarding?.completedAt) {
      throw redirect({ to: "/setup" });
    }

    return { user };
  },
  component: IndexPage,
});

function IndexPage() {
  const context = Route.useRouteContext();

  if (!context.isAuthenticated || !("user" in context) || !context.user) {
    return <LoginPage />;
  }

  return <Dashboard user={context.user} />;
}
