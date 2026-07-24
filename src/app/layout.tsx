import type { Metadata, Viewport } from "next";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "AppPassport — Which apps work where you travel",
    template: "%s · AppPassport",
  },
  description:
    "Know which US apps work abroad — and which local alternatives to download before you fly. Payments, messaging, maps, ride-hailing and more, country by country.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "AppPassport",
    description: SITE.tagline,
    url: SITE.url,
    siteName: "AppPassport",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2a43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
