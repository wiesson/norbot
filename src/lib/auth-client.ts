import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const authBaseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : import.meta.env.VITE_APP_URL;

export const authClient = createAuthClient({
  ...(authBaseUrl ? { baseURL: authBaseUrl } : {}),
  plugins: [magicLinkClient(), crossDomainClient(), convexClient()],
});
