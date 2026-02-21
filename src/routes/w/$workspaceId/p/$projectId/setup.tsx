import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/setup")({
  component: ProjectSetupPage,
});

function ProjectSetupPage() {
  const { projectId } = Route.useParams();

  return (
    <main className="py-6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Setup for project {projectId}. Coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
