import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a cryptographically secure API key
function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  // Convert to base36 (alphanumeric) for URL-safe key
  const key = Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  return `nrbt_${key}`;
}

// Helper to get current user from auth identity
async function getCurrentUser(ctx: { db: any; auth: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Look up user by email (the identity contains the user's email)
  const email = identity.email;
  if (!email) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
}

// Helper to verify workspace membership
async function verifyWorkspaceMember(
  ctx: { db: any; auth: any },
  workspaceId: any
): Promise<{ userId: any; role: string } | null> {
  const user = await getCurrentUser(ctx);
  if (!user) return null;

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_and_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", user._id)
    )
    .first();

  if (!membership) return null;
  return { userId: user._id, role: membership.role };
}

// List API keys for a workspace
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    // Verify user is a workspace member
    const member = await verifyWorkspaceMember(ctx, args.workspaceId);
    if (!member) {
      return []; // Return empty list for unauthorized users
    }

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
    // Verify user is a workspace member
    const member = await verifyWorkspaceMember(ctx, args.workspaceId);
    if (!member) {
      throw new Error("Unauthorized");
    }

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
    // Get the key to verify workspace ownership
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Verify user is a workspace member
    const member = await verifyWorkspaceMember(ctx, apiKey.workspaceId);
    if (!member) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.keyId);
  },
});

// Get MCP config snippet for an API key
export const getMcpConfig = query({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) return null;

    // Verify user is a workspace member
    const member = await verifyWorkspaceMember(ctx, apiKey.workspaceId);
    if (!member) {
      return null;
    }

    const project = await ctx.db.get(apiKey.projectId);

    return {
      keyPrefix: apiKey.keyPrefix,
      projectName: project?.name ?? "Unknown",
      projectShortCode: project?.shortCode ?? "???",
    };
  },
});
