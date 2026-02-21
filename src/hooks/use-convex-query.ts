import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from "convex/server";

/**
 * Typed wrapper around useQuery(convexQuery(...)) that preserves
 * the Convex function return type. The upstream convexQuery helper
 * uses a conditional return type that breaks TanStack useQuery's
 * type inference, causing `data` to be typed as `{}`.
 */
export function useConvexQuery<F extends FunctionReference<"query">>(
  funcRef: F,
  args: FunctionArgs<F> | "skip",
): UseQueryResult<FunctionReturnType<F>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(convexQuery(funcRef, args as any) as any);
}
