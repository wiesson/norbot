import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    ...tanstackStart(),
    react(),
  ],
  ssr: {
    noExternal: ["@convex-dev/better-auth"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@convex": path.resolve(__dirname, "convex"),
      "next/link": path.resolve(__dirname, "src/compat/next-link.tsx"),
      "next/navigation": path.resolve(__dirname, "src/compat/next-navigation.ts"),
    },
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
