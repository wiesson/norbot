import { createFileRoute } from "@tanstack/react-router";
import WorkspaceProjectPage from "@/app/w/[slug]/p/[projectShortCode]/page";
import { requireAuth } from "@/lib/route-auth";

function WorkspaceProjectRouteComponent() {
  const { slug, projectShortCode } = Route.useParams();
  return <WorkspaceProjectPage params={Promise.resolve({ slug, projectShortCode })} />;
}

export const Route = createFileRoute("/w/$slug/p/$projectShortCode")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: WorkspaceProjectRouteComponent,
});
