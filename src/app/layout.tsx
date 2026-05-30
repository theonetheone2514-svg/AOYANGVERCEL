import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import PwaRegister from "@/components/PwaRegister";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "เอาหยังบ่ | สั่งอาหารออนไลน์ บ้านสูงเนิน สกลนคร",
    template: "%s | เอาหยังบ่",
  },
  description: "สั่งอาหารง่าย ๆ แถวบ้านสูงเนิน สกลนคร เว็บอีสาน กันเอง หิว ๆ สั่งเลย!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "เอาหยังบ่",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "เอาหยังบ่",
    title: "เอาหยังบ่ | สั่งอาหารออนไลน์ บ้านสูงเนิน สกลนคร",
    description: "สั่งอาหารง่าย ๆ แถวบ้านสูงเนิน สกลนคร เว็บอีสาน กันเอง หิว ๆ สั่งเลย!",
    url: siteUrl,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "เอาหยังบ่ Logo" }],
  },
  twitter: {
    card: "summary",
    site: "@eaohyangba",
    title: "เอาหยังบ่ | สั่งอาหารออนไลน์ บ้านสูงเนิน สกลนคร",
    description: "สั่งอาหารง่าย ๆ แถวบ้านสูงเนิน สกลนคร เว็บอีสาน กันเอง หิว ๆ สั่งเลย!",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9C4A35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ClientLayout>
          <PwaRegister />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
