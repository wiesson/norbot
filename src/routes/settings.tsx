import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-auth";
import { SettingsRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: SettingsRouteView,
});
