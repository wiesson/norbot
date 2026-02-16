import { createFileRoute } from "@tanstack/react-router";
import WorkspaceProjectPage from "@/app/w/[slug]/p/[projectShortCode]/page";
import { requireServerSession } from "@/lib/route-auth";

function WorkspaceProjectRouteComponent() {
  const { slug, projectShortCode } = Route.useParams();
  return <WorkspaceProjectPage params={Promise.resolve({ slug, projectShortCode })} />;
}

export const Route = createFileRoute("/w/$slug/p/$projectShortCode")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: WorkspaceProjectRouteComponent,
});
