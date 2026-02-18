"use client";

import type { ButtonHTMLAttributes } from "react";

type LogoutButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function LogoutButton({ onClick, ...props }: LogoutButtonProps) {
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] = (
    event
  ) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    window.location.href = "/logout";
  };

  return <button type="button" {...props} onClick={handleClick} />;
}
