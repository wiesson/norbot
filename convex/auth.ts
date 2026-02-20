import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth as any);

const appOrigin = process.env.APP_URL;
if (!appOrigin) {
  throw new Error("Missing APP_URL environment variable");
}

async function getUserWithWorkspaces(
  ctx: { db: any },
  userId: Id<"users">
) {
  const user = await ctx.db.get(userId);
  if (!user) return null;

  const memberships = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .collect();

  const workspaces = await Promise.all(
    memberships.map(async (membership: any) => {
      const workspace = await ctx.db.get(membership.workspaceId);
      return workspace ? { ...workspace, role: membership.role } : null;
    })
  );

  return {
    ...user,
    workspaces: workspaces.filter(Boolean),
  };
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
      crossDomain({
        siteUrl: appOrigin,
      }),
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
    session: {
      cookieCache: {
        enabled: true,
      },
    },
    ...authConfig,
  });

export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);

    if (!authUser?.email) {
      throw new Error("Unauthorized");
    }

    const email = authUser.email.toLowerCase();
    const now = Date.now();
    const name = authUser.name || email.split("@")[0] || "User";
    const avatarUrl = authUser.image ?? undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        avatarUrl,
        lastSeenAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // For new users, only set githubId/githubUsername if available from GitHub OAuth
    const githubAccount = (authUser as any).accounts?.find(
      (a: any) => a.providerId === "github"
    );

    return await ctx.db.insert("users", {
      email,
      name,
      avatarUrl,
      githubId: githubAccount ? Number(githubAccount.accountId) : undefined,
      githubUsername: githubAccount?.username ?? undefined,
      preferences: {
        notifications: {
          slackDM: true,
          email: false,
        },
      },
      isActive: true,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);

    if (!authUser?.email) {
      return null;
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .first();

    if (!existing) {
      return null;
    }

    return await getUserWithWorkspaces(ctx, existing._id);
  },
});

export const providersStatus = query({
  args: {},
  handler: async () => {
    const github =
      !!process.env.GITHUB_CLIENT_ID &&
      !!process.env.GITHUB_CLIENT_SECRET;
    const google =
      !!process.env.GOOGLE_CLIENT_ID &&
      !!process.env.GOOGLE_CLIENT_SECRET;
    const ml =
      !!process.env.MAGIC_LINK_FROM_EMAIL &&
      !!process.env.RESEND_API_KEY;

    return {
      github,
      google,
      magicLink: ml,
      password: true,
    };
  },
});
