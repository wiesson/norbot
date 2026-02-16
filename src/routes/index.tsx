import { createFileRoute } from "@tanstack/react-router";
import { HomeRouteView } from "@/views/protected-pages";

export const Route = createFileRoute("/")({
  component: HomeRouteView,
});
