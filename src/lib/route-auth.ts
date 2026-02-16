import { redirect } from "@tanstack/react-router";
import { getServerSessionStatus } from "@/server/auth";

export async function requireServerSession() {
  const { hasSession } = await getServerSessionStatus();

  if (!hasSession) {
    throw redirect({ to: "/login" });
  }
}

export async function redirectAuthenticatedToHome() {
  const { hasSession } = await getServerSessionStatus();

  if (hasSession) {
    throw redirect({ to: "/" });
  }
}
