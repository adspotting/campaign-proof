import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campaign Proof | Defensible B2B campaign reporting",
  description:
    "Connect campaign and CRM data to produce source-linked, deal-cycle-aware B2B performance reports.",
  metadataBase: new URL("https://getcampaignproof.com"),
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
