import type { Metadata } from "next";
import { getLegalMarkdown } from "@/lib/legal";
import MarkdownPage from "@/components/MarkdownPage";

export const metadata: Metadata = { title: "Content Accuracy Disclaimer" };

export default async function DisclaimerPage() {
  const md = await getLegalMarkdown("disclaimer");
  return <MarkdownPage markdown={md} />;
}
