import { createFileRoute } from "@tanstack/react-router";
import { requireServerSession } from "@/lib/route-auth";
import { SetupRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/setup")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: SetupRouteView,
});
