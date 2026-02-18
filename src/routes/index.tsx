import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/views/landing-page";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
