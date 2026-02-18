import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const authBaseUrl = import.meta.env.VITE_APP_URL;

if (!authBaseUrl) {
  throw new Error("Missing VITE_APP_URL");
}

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [magicLinkClient(), crossDomainClient(), convexClient()],
});
