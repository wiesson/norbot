import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export function requireAuth(context: { isAuthenticated: boolean }) {
  if (!context.isAuthenticated) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }
}

export async function redirectAuthenticatedToHome(context: {
  isAuthenticated: boolean;
}, redirectTo?: string) {
  if (context.isAuthenticated) {
    const user = await ensureViewer();
    if (user) {
      throw redirect({ to: redirectTo || "/app" });
    }
  }
}

export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.auth.viewer, {});
});

export const ensureViewer = createServerFn({ method: "GET" }).handler(async () => {
  const user = await fetchAuthQuery(api.auth.viewer, {});
  if (user) {
    return user;
  }

  try {
    await fetchAuthMutation(api.auth.syncUser, {});
  } catch {
    return null;
  }

  return await fetchAuthQuery(api.auth.viewer, {});
});

export async function requireAuthWithUser(context: {
  isAuthenticated: boolean;
}) {
  requireAuth(context);
  const user = await ensureViewer();
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }
  return { user };
}
