import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  display: "swap",
  weight: ["300", "400", "500"],
});

const BASE_URL = "https://removix.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Removix — AI Background Remover",
  description:
    "Remove image backgrounds instantly with AI. Free, private, no signup. Powered by ISNet neural network running entirely in your browser — your image never leaves your device.",
  keywords: ["background remover", "remove background", "AI", "free", "no signup", "privacy", "ISNet", "browser"],
  openGraph: {
    title: "Removix — AI Background Remover",
    description: "Instant in-browser AI background removal. Free, private, no signup.",
    url: BASE_URL,
    siteName: "Removix",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Removix AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Removix — AI Background Remover",
    description: "Instant in-browser AI background removal. Free, private, no signup.",
    images: ["/api/og"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Removix",
  url: BASE_URL,
  description: "Remove image backgrounds instantly with AI. Free, private, no signup. Runs entirely in your browser.",
  applicationCategory: "PhotographyApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} style={{ fontFamily: 'var(--font-dmsans, DM Sans), sans-serif' }}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
