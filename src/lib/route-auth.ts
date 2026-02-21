import { createServerFn } from "@tanstack/react-start";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    return await fetchAuthQuery(api.authFunctions.currentUser, {});
  },
);
