import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { workspaceId, projectId } = Route.useParams();
  const { data: project, error } = useConvexQuery(api.projects.getById, {
    id: projectId as Id<"projects">,
  });

  if (project === undefined && !error) return null;

  if (!project) {
    return <Navigate to="/w/$workspaceId" params={{ workspaceId }} />;
  }

  return (
    <main className="py-6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(project, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
