import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export function requireAuth(context: { isAuthenticated: boolean }) {
  if (!context.isAuthenticated) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }
}

export async function redirectAuthenticatedToHome(
  context: { isAuthenticated: boolean },
  redirectTo?: string
) {
  if (!context.isAuthenticated) return;

  if (redirectTo) {
    throw redirect({ to: redirectTo as any });
  }

  const user = await ensureViewer();

  if (user?.workspaces?.length) {
    const slug = user.workspaces[0].slug;
    throw redirect({ to: "/w/$slug", params: { slug } });
  }

  // Always redirect — even if ensureViewer() returned null
  throw redirect({ to: "/onboarding" });
}

export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.auth.viewer, {});
});

export const ensureViewer = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await fetchAuthQuery(api.auth.viewer, {});
    if (user) {
      return user;
    }

    try {
      await fetchAuthMutation(api.auth.syncUser, {});
    } catch (error) {
      console.error("[ensureViewer] syncUser failed:", error);
      return null;
    }

    return await fetchAuthQuery(api.auth.viewer, {});
  }
);

export async function requireViewer() {
  const user = await ensureViewer();
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  }
  return user;
}

export async function requireAuthWithUser(context: {
  isAuthenticated: boolean;
}) {
  requireAuth(context);
  const user = await requireViewer();
  return { user };
}

export async function requireApprovedUser(context: {
  isAuthenticated: boolean;
}) {
  const { user } = await requireAuthWithUser(context);

  if (!user.workspaces?.length && !user.isApproved) {
    throw redirect({ to: "/onboarding" });
  }

  return { user };
}
