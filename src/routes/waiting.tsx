import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-auth";
import { WaitingRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/waiting")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: WaitingRouteView,
});
