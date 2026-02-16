import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterProvider } from "@/router";
import "@/app/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouterProvider />
  </StrictMode>
);
