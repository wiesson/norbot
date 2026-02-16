import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import BotPage from "@/app/bot/page";
import InvitePage from "@/app/invite/[token]/page";
import WorkspacePage from "@/app/w/[slug]/page";
import WorkspaceInvitePage from "@/app/w/[slug]/invite/page";
import WorkspaceProjectPage from "@/app/w/[slug]/p/[projectShortCode]/page";
import WorkspaceSettingsPage from "@/app/w/[slug]/settings/page";
import { LoginRouteView } from "@/routes/login";
import {
  HomeRouteView,
  LogoutRedirectRouteView,
  NewWorkspaceRouteView,
  SettingsRouteView,
  SetupRouteView,
  WaitingRouteView,
} from "@/routes/protected-pages";

function AppShell() {
  return (
    <Providers>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
    </Providers>
  );
}

function InviteRouteView() {
  const { token } = useParams({ from: "/invite/$token" });
  return <InvitePage params={Promise.resolve({ token })} />;
}

function WorkspaceRouteView() {
  const { slug } = useParams({ from: "/w/$slug" });
  return <WorkspacePage params={Promise.resolve({ slug })} />;
}

function WorkspaceInviteRouteView() {
  const { slug } = useParams({ from: "/w/$slug/invite" });
  return <WorkspaceInvitePage params={Promise.resolve({ slug })} />;
}

function WorkspaceProjectRouteView() {
  const { slug, projectShortCode } = useParams({
    from: "/w/$slug/p/$projectShortCode",
  });
  return (
    <WorkspaceProjectPage params={Promise.resolve({ slug, projectShortCode })} />
  );
}

function WorkspaceSettingsRouteView() {
  const { slug } = useParams({ from: "/w/$slug/settings" });
  return <WorkspaceSettingsPage params={Promise.resolve({ slug })} />;
}

const rootRoute = createRootRoute({
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRouteView,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRouteView,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: SetupRouteView,
});

const waitingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/waiting",
  component: WaitingRouteView,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsRouteView,
});

const newWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workspaces/new",
  component: NewWorkspaceRouteView,
});

const logoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/api/auth/logout",
  component: LogoutRedirectRouteView,
});

const botRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bot",
  component: BotPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: InviteRouteView,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug",
  component: WorkspaceRouteView,
});

const workspaceInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug/invite",
  component: WorkspaceInviteRouteView,
});

const workspaceProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug/p/$projectShortCode",
  component: WorkspaceProjectRouteView,
});

const workspaceSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug/settings",
  component: WorkspaceSettingsRouteView,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  setupRoute,
  waitingRoute,
  settingsRoute,
  newWorkspaceRoute,
  logoutRoute,
  botRoute,
  inviteRoute,
  workspaceRoute,
  workspaceInviteRoute,
  workspaceProjectRoute,
  workspaceSettingsRoute,
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
