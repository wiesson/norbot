import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===========================================
// QUERIES
// ===========================================

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByGithubId = query({
  args: { githubId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const listUsersWithoutWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    const usersWithoutWorkspaces = [];
    for (const user of allUsers) {
      const membership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!membership) {
        usersWithoutWorkspaces.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          githubUsername: user.githubUsername,
          createdAt: user.createdAt,
        });
      }
    }

    return usersWithoutWorkspaces;
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const upsertFromGithub = mutation({
  args: {
    githubId: v.number(),
    githubUsername: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    githubAccessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        githubUsername: args.githubUsername,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        githubAccessToken: args.githubAccessToken,
        lastSeenAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      githubId: args.githubId,
      githubUsername: args.githubUsername,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      githubAccessToken: args.githubAccessToken,
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

export const linkSlack = mutation({
  args: {
    userId: v.id("users"),
    slackUserId: v.string(),
    slackUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      slackUserId: args.slackUserId,
      slackUsername: args.slackUsername,
      updatedAt: Date.now(),
    });
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      defaultWorkspaceId: v.optional(v.id("workspaces")),
      notifications: v.object({
        slackDM: v.boolean(),
        email: v.boolean(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      preferences: args.preferences,
      updatedAt: Date.now(),
    });
  },
});

export const updateOnboarding = mutation({
  args: {
    userId: v.id("users"),
    onboarding: v.object({
      completedAt: v.optional(v.number()),
      skippedSteps: v.array(v.string()),
      currentStep: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      onboarding: args.onboarding,
      updatedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      onboarding: {
        completedAt: Date.now(),
        skippedSteps: user.onboarding?.skippedSteps ?? [],
        currentStep: undefined,
      },
      updatedAt: Date.now(),
    });
  },
});

export const resetOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      onboarding: {
        completedAt: undefined,
        skippedSteps: [],
        currentStep: "github",
      },
      updatedAt: Date.now(),
    });
  },
});
