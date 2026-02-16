import { createFileRoute } from "@tanstack/react-router";
import { LogoutRedirectRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/api/auth/logout")({
  component: LogoutRedirectRouteView,
});
