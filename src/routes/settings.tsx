import { createFileRoute } from "@tanstack/react-router";
import { requireServerSession } from "@/lib/route-auth";
import { SettingsRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/settings")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: SettingsRouteView,
});
