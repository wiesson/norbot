import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-auth";
import { SetupRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/setup")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: SetupRouteView,
});
