import { useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

type NavOptions = {
  scroll?: boolean;
};

export function useRouter() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const resolveHref = (href: string) => (href.startsWith("?") ? `${pathname}${href}` : href);

  return useMemo(
    () => ({
      push: (href: string, options?: NavOptions) =>
        navigate({
          to: resolveHref(href),
          replace: false,
          resetScroll: options?.scroll !== false,
        }),
      replace: (href: string, options?: NavOptions) =>
        navigate({
          to: resolveHref(href),
          replace: true,
          resetScroll: options?.scroll !== false,
        }),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => window.location.reload(),
    }),
    [navigate, pathname]
  );
}

export function useSearchParams() {
  const searchString = useRouterState({
    select: (state) => state.location.searchStr,
  });

  return useMemo(() => new URLSearchParams(searchString), [searchString]);
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") {
    window.location.replace(href);
  }

  throw new Error(`Redirecting to ${href}`);
}
