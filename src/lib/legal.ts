import { promises as fs } from "fs";
import path from "path";
import { getLegalPageFromSanity } from "../../sanity/queries";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

export type LegalSlug = "privacy" | "terms" | "cookies" | "disclaimer";

/**
 * Legal page Markdown. Prefers Sanity (if a page with this slug exists there),
 * otherwise falls back to the committed markdown file so the site always works.
 * {{DATE}} is replaced with the file's last-modified date.
 */
export async function getLegalMarkdown(slug: LegalSlug): Promise<string> {
  const fromSanity = await getLegalPageFromSanity(slug);
  if (fromSanity && fromSanity.trim()) {
    return fromSanity.replaceAll("{{DATE}}", "");
  }

  const filePath = path.join(LEGAL_DIR, `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  let modified = "";
  try {
    const stat = await fs.stat(filePath);
    modified = stat.mtime.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    /* ignore */
  }
  return raw.replaceAll("{{DATE}}", modified);
}
