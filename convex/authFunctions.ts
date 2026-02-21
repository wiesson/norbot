import { query } from "./_generated/server";
import { authComponent } from "./auth";

async function getUserWithWorkspaces(ctx: { db: any }, userId: any) {
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
    }),
  );

  return {
    ...user,
    workspaces: workspaces.filter(Boolean),
  };
}

export const currentUser = query({
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
      !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
    const google =
      !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    const ml =
      !!process.env.MAGIC_LINK_FROM_EMAIL && !!process.env.RESEND_API_KEY;

    return {
      github,
      google,
      magicLink: ml,
      password: true,
    };
  },
});
