import { createFileRoute } from "@tanstack/react-router";
import { LogoutRedirectRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/logout")({
  component: LogoutRedirectRouteView,
});
