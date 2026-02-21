import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWorkspace } from "@/hooks/use-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { useState } from "react";

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
          <CreateProjectCard workspaceId={workspaceId} />
        )}
      </div>
    </main>
  );
}

function CreateProjectCard({ workspaceId }: { workspaceId: string }) {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const createProject = useMutation(api.projects.create);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function deriveCode(projectName: string) {
    return projectName
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!codeEdited) {
      setShortCode(deriveCode(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const projectId = await createProject({
        workspaceId: workspace._id,
        name: name.trim(),
        shortCode: shortCode.trim().toUpperCase(),
      });
      navigate({
        to: "/w/$workspaceId/p/$projectId",
        params: { workspaceId, projectId },
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to create project");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create your first project
        </CardTitle>
        <CardDescription>
          Projects group tasks and give them short codes like PROJ-123.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                placeholder="My Project"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-code">Code</Label>
              <Input
                id="project-code"
                placeholder="PROJ"
                value={shortCode}
                onChange={(e) => {
                  setShortCode(e.target.value.toUpperCase());
                  setCodeEdited(true);
                }}
                maxLength={5}
                disabled={submitting}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={!name.trim() || !shortCode.trim() || submitting}
            className="self-start"
          >
            {submitting ? "Creating..." : "Create project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
