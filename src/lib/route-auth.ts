import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export function requireAuth(context: { isAuthenticated: boolean }) {
  if (!context.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

export async function redirectAuthenticatedToHome(context: {
  isAuthenticated: boolean;
}) {
  if (context.isAuthenticated) {
    const user = await getViewer();
    if (user) {
      throw redirect({ to: "/app" });
    }
  }
}

export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.auth.viewer, {});
});

export async function requireAuthWithUser(context: {
  isAuthenticated: boolean;
}) {
  requireAuth(context);
  const user = await getViewer();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return { user };
}
