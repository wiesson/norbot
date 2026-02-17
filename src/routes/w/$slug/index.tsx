import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/app/w/[slug]/page";
import { requireAuth } from "@/lib/route-auth";

function WorkspaceRouteComponent() {
  const { slug } = Route.useParams();
  return <WorkspacePage params={Promise.resolve({ slug })} />;
}

export const Route = createFileRoute("/w/$slug/")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: WorkspaceRouteComponent,
});
