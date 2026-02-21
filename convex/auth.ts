"use node";

import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(
  components.betterAuth as any,
);

const appOrigin = process.env.APP_URL;
if (!appOrigin) {
  throw new Error("Missing APP_URL environment variable");
}

async function sendMagicLinkEmail(email: string, url: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAGIC_LINK_FROM_EMAIL;

  if (!resendApiKey || !from) {
    console.log(`[magic-link] ${email}: ${url}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Sign in to Norbot",
      html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send magic link email: ${response.status}`);
  }
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: appOrigin,
    database: authComponent.adapter(ctx),
    plugins: [
      convex({ authConfig }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    trustedOrigins: [appOrigin],
  });
