import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, GitBranch } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { useWorkspace } from "../route";

export const Route = createFileRoute("/w/$slug/p/$projectShortCode")({
  component: ProjectPage,
});

function ProjectPage() {
  const { slug, projectShortCode } = Route.useParams();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const searchParams = useMemo(() => {
    const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
    return new URLSearchParams(raw);
  }, [searchStr]);

  const repoFilter = searchParams.get("repo");
  const isAllProjects = projectShortCode.toLowerCase() === "all";

  const workspace = useWorkspace();
  const repositories = useQuery(
    api.repositories.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const projectList = useQuery(
    api.projects.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const selectedProject = useQuery(
    api.projects.getByShortCode,
    workspace && !isAllProjects
      ? { workspaceId: workspace._id, shortCode: projectShortCode }
      : "skip"
  );
  const projects = projectList ?? [];

  const selectedRepositoryId =
    repoFilter && repositories?.some((repo) => repo._id === repoFilter)
      ? (repoFilter as Id<"repositories">)
      : undefined;

  const updateRepoFilter = (value: string | null) => {
    if (value === null) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("repo");
    } else {
      params.set("repo", value);
    }
    const query = params.toString();
    router.history.push(query ? `${pathname}?${query}` : pathname);
  };

  if (!workspace || (!isAllProjects && selectedProject === undefined)) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAllProjects && selectedProject === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/w/$slug"
          params={{ slug }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <p className="font-medium">Project not found</p>
            <p className="text-sm text-muted-foreground">
              No project with code <code>{projectShortCode}</code> exists in this workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="border-b bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/w/$slug"
              params={{ slug }}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Badge>{isAllProjects ? "ALL" : selectedProject?.shortCode}</Badge>
              <span className="text-sm text-muted-foreground">
                {isAllProjects ? "All workspace tasks" : selectedProject?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-1">
              <Link
                to="/w/$slug/p/$projectShortCode"
                params={{ slug, projectShortCode: "all" }}
                className={buttonVariants({ size: "sm", variant: isAllProjects ? "default" : "outline" })}
              >
                All
              </Link>
              {projects.map((project) => (
                <Link
                  key={project._id}
                  to="/w/$slug/p/$projectShortCode"
                  params={{ slug, projectShortCode: project.shortCode }}
                  className={buttonVariants({
                    size: "sm",
                    variant: !isAllProjects && selectedProject?._id === project._id ? "default" : "outline",
                  })}
                >
                  {project.shortCode}
                </Link>
              ))}
            </div>

            {repositories && repositories.length > 0 && (
              <Select
                value={selectedRepositoryId ?? "all"}
                onValueChange={updateRepoFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <GitBranch className="size-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All repositories</SelectItem>
                  {repositories.map((repo) => (
                    <SelectItem key={repo._id} value={repo._id}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <main className="py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <KanbanBoard
            workspaceId={workspace._id}
            repositoryId={selectedRepositoryId}
            projectId={selectedProject?._id}
          />
        </div>
      </main>
    </>
  );
}
