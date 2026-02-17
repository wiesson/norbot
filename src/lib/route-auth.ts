import { redirect } from "@tanstack/react-router";

export function requireAuth(context: { isAuthenticated: boolean }) {
  if (!context.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

export function redirectAuthenticatedToHome(context: {
  isAuthenticated: boolean;
}) {
  if (context.isAuthenticated) {
    throw redirect({ to: "/" });
  }
}
