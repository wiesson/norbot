import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Settings, LogOut } from "lucide-react";
import { requireApprovedUser } from "@/lib/route-auth";

const WorkspaceContext = createContext<
  Doc<"workspaces"> | null | undefined
>(undefined);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export const Route = createFileRoute("/w/$slug")({
  beforeLoad: async ({ context }) => {
    return await requireApprovedUser(context);
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();
  const workspaceFromMembership = user.workspaces?.find(
    (ws: { slug?: string } | null) => ws?.slug === slug
  );
  const workspaceFromQuery = useQuery(api.workspaces.getBySlug, { slug });
  const workspace = workspaceFromQuery ?? workspaceFromMembership;

  if (!workspace && workspaceFromQuery === undefined) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="py-8 text-center space-y-2">
              <div className="animate-pulse text-muted-foreground">Loading workspace...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="py-8 text-center space-y-2">
              <p className="font-medium">Workspace not found</p>
              <p className="text-sm text-muted-foreground">
                No workspace with slug <code>{slug}</code> exists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <a href={`/w/${slug}`}>
              <div>
                <h1 className="text-lg font-bold">
                  {workspace?.name ?? slug}
                </h1>
                <p className="text-xs text-muted-foreground">/{slug}</p>
              </div>
            </a>

            <div className="flex items-center gap-4">
              <a
                href={`/w/${slug}/settings`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" })
                )}
              >
                <Settings className="h-5 w-5" />
              </a>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
              </div>
              <a
                href="/logout"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" })
                )}
              >
                <LogOut className="h-5 w-5" />
              </a>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </WorkspaceContext.Provider>
  );
}
