import { promises as fs } from "fs";
import path from "path";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

export type LegalSlug = "privacy" | "terms" | "cookies" | "disclaimer";

/**
 * Read a legal markdown file at request time so Jim can edit the text without
 * touching code. {{DATE}} is replaced with the file's last-modified date.
 */
export async function getLegalMarkdown(slug: LegalSlug): Promise<string> {
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
