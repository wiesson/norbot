"use client";

import type { ButtonHTMLAttributes } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

type LogoutButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function LogoutButton({ onClick, ...props }: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    try {
      await authClient.signOut();
    } finally {
      navigate({ to: "/login", replace: true });
    }
  };

  return <button type="button" {...props} onClick={handleClick} />;
}
