"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = useQuery(api.auth.viewer, session ? {} : "skip");
  const syncUser = useMutation(api.auth.syncUser);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!session || user !== null || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    syncUser({})
      .catch((error) => {
        console.error("Failed to sync auth user:", error);
      })
      .finally(() => {
        isSyncingRef.current = false;
      });
  }, [session, user, syncUser]);

  const queryLoading = !!session && user === undefined;

  return {
    user: user ?? null,
    isLoading: sessionLoading || queryLoading,
    isAuthenticated: !!session,
    session,
  };
}
