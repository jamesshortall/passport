import type { Metadata } from "next";
import { getLegalMarkdown } from "@/lib/legal";
import MarkdownPage from "@/components/MarkdownPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const md = await getLegalMarkdown("privacy");
  return <MarkdownPage markdown={md} />;
}
