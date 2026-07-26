import { defineCliConfig } from "sanity/cli";
import { projectId, dataset } from "./sanity/env";

// Used by the Sanity CLI (`npx sanity dev` / `npx sanity deploy`).
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET from env.
export default defineCliConfig({ api: { projectId, dataset } });
