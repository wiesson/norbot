import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Settings, LogOut, ChevronLeft, Slack, ArrowRight, FolderKanban } from "lucide-react";
import { requireAuthWithUser } from "@/lib/route-auth";

export const Route = createFileRoute("/w/$slug/")({
  beforeLoad: async ({ context }) => {
    return await requireAuthWithUser(context);
  },
  component: WorkspacePage,
});

function WorkspacePage() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();

  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  const projects = useQuery(
    api.projects.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/app"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mr-2")}
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                {workspace.name}
                <Badge variant="secondary" className="text-xs font-normal">
                  <Slack className="h-3 w-3 mr-1" />
                  {workspace.slackTeamName}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
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
              <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="text-sm text-muted-foreground">
              Open a project board, or view all workspace tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <a href={`/w/${slug}/p/all`}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>All Tasks</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Workspace-wide board</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">ALL</Badge>
                </CardContent>
              </Card>
            </a>

            {projects?.map((project) => (
              <a key={project._id} href={`/w/${slug}/p/${project.shortCode}`}>
                <Card className="hover:border-primary transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      {project.repositories?.length ?? 0} linked repos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge>{project.shortCode}</Badge>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {projects && projects.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <p className="font-medium">No projects yet</p>
                <p className="text-sm text-muted-foreground">
                  Create projects via Slack with <code>@norbot create project</code>, then open them here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
