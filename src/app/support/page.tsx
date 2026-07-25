import type { Metadata } from "next";
import SupportCenter from "@/components/support/SupportCenter";

export const metadata: Metadata = {
  title: "Support Center",
  description:
    "Get help with AppPassport, send feedback, browse FAQs, and see what's new. Part of The Travel Technician.",
};

export default function SupportPage() {
  return <SupportCenter />;
}
