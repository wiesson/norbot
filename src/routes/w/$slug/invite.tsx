import { createFileRoute } from "@tanstack/react-router";
import WorkspaceInvitePage from "@/app/w/[slug]/invite/page";
import { requireServerSession } from "@/lib/route-auth";

function WorkspaceInviteRouteComponent() {
  const { slug } = Route.useParams();
  return <WorkspaceInvitePage params={Promise.resolve({ slug })} />;
}

export const Route = createFileRoute("/w/$slug/invite")({
  beforeLoad: async () => {
    await requireServerSession();
  },
  component: WorkspaceInviteRouteComponent,
});
