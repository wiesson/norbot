import { createFileRoute } from "@tanstack/react-router";
import { requireServerSession } from "@/lib/route-auth";
import { WaitingRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/waiting")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: WaitingRouteView,
});
