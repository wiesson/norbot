import { createFileRoute } from "@tanstack/react-router";
import BotPage from "@/app/bot/page";
import { requireServerSession } from "@/lib/route-auth";

export const Route = createFileRoute("/bot")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: BotPage,
});
