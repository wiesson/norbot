import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { createServerFn } from "@tanstack/react-start";
import { api } from "@convex/_generated/api";

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

function getConvexConfig() {
  const convexUrl = readEnv("VITE_CONVEX_URL", "CONVEX_URL");
  const convexSiteUrl = readEnv("VITE_CONVEX_SITE_URL", "CONVEX_SITE_URL");

  if (!convexUrl || !convexSiteUrl) {
    return null;
  }

  return { convexUrl, convexSiteUrl };
}

export const getServerSessionStatus = createServerFn({ method: "GET" }).handler(async () => {
  const config = getConvexConfig();
  if (!config) {
    return { hasSession: false };
  }

  const auth = convexBetterAuthReactStart(config);
  const hasSession = await auth.fetchAuthQuery(api.auth.hasSession, {});

  return { hasSession };
});
