import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SupportCenter from "@/components/support/SupportCenter";

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

  return <SupportCenter />;
}
