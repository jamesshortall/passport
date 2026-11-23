import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SupportCenter from "@/components/support/SupportCenter";
import { FAQS, CHANGELOG } from "@/lib/supportContent";
import { getFaqsFromSanity, getChangelogFromSanity } from "../../../sanity/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Center",
  description:
    "Get help with AppPassport, send feedback, browse FAQs, and see what's new. Part of The Travel Technician.",
};

export default async function SupportPage() {
  // Support Center is for signed-in users only (pending accounts included).
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/support");

  // FAQ + What's New come from Sanity when configured, else the built-in content.
  const [faqs, changelog] = await Promise.all([
    getFaqsFromSanity(FAQS),
    getChangelogFromSanity(CHANGELOG),
  ]);

  return <SupportCenter faqs={faqs} changelog={changelog} />;
}
