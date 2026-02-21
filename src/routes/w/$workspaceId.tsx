import { Navigate, createFileRoute, Outlet } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { WorkspaceContext } from "@/hooks/use-workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

export const Route = createFileRoute("/w/$workspaceId")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { workspaceId } = Route.useParams();
  const { data: workspace, error: wsError } = useConvexQuery(
    api.workspaces.getById,
    { id: workspaceId as Id<"workspaces"> },
  );
  const { data: user } = useConvexQuery(api.authFunctions.currentUser, {});

  if (workspace === undefined && !wsError) return null;

  if (!workspace) {
    return <Navigate to="/w" />;
  }

  return (
    <WorkspaceContext.Provider
      value={{ workspaceId: workspace._id, workspace }}
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            {user ? (
              <WorkspaceSwitcher
                currentWorkspace={workspace}
                workspaces={user.workspaces}
                userId={user._id}
              />
            ) : (
              <div>
                <p className="text-sm font-semibold">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{workspace.slug}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">
                    {user.name}
                  </span>
                </div>
              )}
              <a
                href="/logout"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
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
