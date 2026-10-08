import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isPagesBuild = process.env.CROSSROAD_PAGES_BUILD === "true";
export default defineConfig({
  plugins: [react()],
  base: isPagesBuild && repoName ? `/${repoName}/` : "/",
});
