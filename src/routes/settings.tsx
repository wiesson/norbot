import { createFileRoute } from "@tanstack/react-router";
import { requireAuthWithUser } from "@/lib/route-auth";
import { SettingsRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context }) => {
    return await requireAuthWithUser(context);
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  return <SettingsRouteView user={user} />;
}
