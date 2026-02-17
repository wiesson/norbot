import { createFileRoute } from "@tanstack/react-router";
import BotPage from "@/app/bot/page";
import { requireAuth } from "@/lib/route-auth";

export const Route = createFileRoute("/bot")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: BotPage,
});
