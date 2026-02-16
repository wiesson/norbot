import { redirect } from "@/compat/next-navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { getSessionToken } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function Home() {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  const user = await convex.query(api.users.me, { sessionToken: token });

  if (!user) {
    redirect("/login");
  }

  // Check if user has any workspaces - redirect to waiting room if not
  const hasWorkspaces = user.workspaces && user.workspaces.length > 0;
  if (!hasWorkspaces) {
    redirect("/waiting");
  }

  if (!user.onboarding?.completedAt) {
    redirect("/setup");
  }

  return <Dashboard user={user} />;
}
