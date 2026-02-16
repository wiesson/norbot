import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  return (
    <Providers>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
    </Providers>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
