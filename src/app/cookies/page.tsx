import type { Metadata } from "next";
import { getLegalMarkdown } from "@/lib/legal";
import MarkdownPage from "@/components/MarkdownPage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default async function CookiesPage() {
  const md = await getLegalMarkdown("cookies");
  return <MarkdownPage markdown={md} />;
}
