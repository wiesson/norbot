import { createFileRoute } from "@tanstack/react-router";
import WorkspaceSettingsPage from "@/app/w/[slug]/settings/page";
import { requireAuth } from "@/lib/route-auth";

function WorkspaceSettingsRouteComponent() {
  const { slug } = Route.useParams();
  return <WorkspaceSettingsPage params={Promise.resolve({ slug })} />;
}

export const Route = createFileRoute("/w/$slug/settings")({
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
  component: WorkspaceSettingsRouteComponent,
});
