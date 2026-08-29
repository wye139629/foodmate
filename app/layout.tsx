import type { Metadata, Viewport } from "next";
import { DM_Mono, Outfit } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import MapKeepAlive from "@/components/MapKeepAlive";
import "./globals.css";

const bodyFont = Outfit({
  variable: "--font-body-family",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const displayFont = DM_Mono({
  variable: "--font-display-family",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodMate",
  description: "Share food and ingredients with people nearby.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodMate",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF8A4C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <ServiceWorkerRegister />
        {children}
        <MapKeepAlive />
      </body>
    </html>
  );
}
