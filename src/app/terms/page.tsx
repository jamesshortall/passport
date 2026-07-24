import type { Metadata } from "next";
import { getLegalMarkdown } from "@/lib/legal";
import MarkdownPage from "@/components/MarkdownPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const md = await getLegalMarkdown("terms");
  return <MarkdownPage markdown={md} />;
}
