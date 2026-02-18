import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Settings, LogOut, ChevronLeft } from "lucide-react";
import { requireApprovedUser } from "@/lib/route-auth";

export const Route = createFileRoute("/w/$slug/p/$projectShortCode")({
  beforeLoad: async ({ context }) => {
    return await requireApprovedUser(context);
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { slug, projectShortCode } = Route.useParams();
  const { user } = Route.useRouteContext();
  const isAllProjects = projectShortCode.toLowerCase() === "all";

  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  const selectedProject = useQuery(
    api.projects.getByShortCode,
    workspace && !isAllProjects
      ? { workspaceId: workspace._id, shortCode: projectShortCode }
      : "skip"
  );

  if (workspace === undefined || (!isAllProjects && selectedProject === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (workspace === null) {
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

  if (!isAllProjects && selectedProject === null) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <a
            href={`/w/${slug}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-6"
            )}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </a>
          <Card>
            <CardContent className="py-8 text-center space-y-2">
              <p className="font-medium">Project not found</p>
              <p className="text-sm text-muted-foreground">
                No project with code <code>{projectShortCode}</code> exists in
                this workspace.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={`/w/${slug}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "mr-2"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                {workspace.name}
                <Badge>
                  {isAllProjects ? "ALL" : selectedProject?.shortCode}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAllProjects
                  ? "All workspace tasks"
                  : selectedProject?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`/w/${slug}/settings`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
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
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <LogOut className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-16 text-center space-y-2">
              <p className="font-medium text-lg">Kanban Board</p>
              <p className="text-muted-foreground">
                The kanban board will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
