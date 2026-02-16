import { createFileRoute } from "@tanstack/react-router";
import InvitePage from "@/app/invite/[token]/page";

function InviteRouteComponent() {
  const { token } = Route.useParams();
  return <InvitePage params={Promise.resolve({ token })} />;
}

export const Route = createFileRoute("/invite/$token")({
  component: InviteRouteComponent,
});
