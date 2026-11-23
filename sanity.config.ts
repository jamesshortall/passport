import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { projectId, dataset } from "./sanity/env";

// Studio for editing AppPassport's editorial content (legal pages, FAQ,
// What's New). Mounted at /studio. `projectId` comes from env; the placeholder
// only exists so the app builds before a Sanity project is connected.
export default defineConfig({
  name: "apppassport",
  title: "AppPassport CMS",
  projectId: projectId || "placeholder",
  dataset,
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
