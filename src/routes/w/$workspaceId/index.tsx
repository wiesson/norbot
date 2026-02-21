import { Link, createFileRoute } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";
import { useWorkspace } from "@/hooks/use-workspace";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/w/$workspaceId/")({
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { workspaceId } = Route.useParams();
  const { workspace } = useWorkspace();
  const { data: projects } = useConvexQuery(api.projects.list, {
    workspaceId: workspace._id,
  });

  return (
    <main className="py-6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Open a project board, or view all workspace tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <Link
              key={project._id}
              to="/w/$workspaceId/p/$projectId"
              params={{ workspaceId, projectId: project._id }}
            >
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    {project.description ?? "Project board"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>{project.shortCode}</Badge>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {projects && projects.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <p className="font-medium">No projects yet</p>
              <p className="text-sm text-muted-foreground">
                Create projects via Slack with{" "}
                <code>@norbot create project</code>, then open them here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
