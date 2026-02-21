import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/w")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: undefined } });
    }
  },
  component: () => <Outlet />,
});
