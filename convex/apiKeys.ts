import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random API key
function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "nrbt_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// List API keys for a workspace
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();

    // Get project names for each key
    const keysWithProjects = await Promise.all(
      keys.map(async (key) => {
        const project = await ctx.db.get(key.projectId);
        return {
          id: key._id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          projectId: key.projectId,
          projectName: project?.name ?? "Unknown",
          projectShortCode: project?.shortCode ?? "???",
          lastUsedAt: key.lastUsedAt,
          createdAt: key.createdAt,
        };
      })
    );

    return keysWithProjects;
  },
});

// Create a new API key
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify project belongs to workspace
    const project = await ctx.db.get(args.projectId);
    if (!project || project.workspaceId !== args.workspaceId) {
      throw new Error("Project not found in this workspace");
    }

    const key = generateApiKey();
    const keyPrefix = key.slice(0, 12) + "...";

    await ctx.db.insert("apiKeys", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      key,
      keyPrefix,
      name: args.name,
      createdAt: Date.now(),
    });

    // Return the full key only once (user must copy it now)
    return {
      key,
      keyPrefix,
      projectShortCode: project.shortCode,
    };
  },
});

// Delete an API key
export const remove = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.keyId);
  },
});

// Get MCP config snippet for an API key
export const getMcpConfig = query({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) return null;

    const project = await ctx.db.get(apiKey.projectId);

    return {
      keyPrefix: apiKey.keyPrefix,
      projectName: project?.name ?? "Unknown",
      projectShortCode: project?.shortCode ?? "???",
    };
  },
});
