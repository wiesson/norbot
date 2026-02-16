import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const authBaseUrl =
  import.meta.env.VITE_CONVEX_SITE_URL ?? import.meta.env.NEXT_PUBLIC_CONVEX_SITE_URL;

if (!authBaseUrl) {
  throw new Error("Missing VITE_CONVEX_SITE_URL or NEXT_PUBLIC_CONVEX_SITE_URL");
}

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [magicLinkClient(), crossDomainClient(), convexClient()],
});
