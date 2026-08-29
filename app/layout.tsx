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

// iOS < 15.4 doesn't generate a splash screen from the manifest like
// Android/modern iOS do — it needs an exact-resolution image per device via
// apple-touch-startup-image. Portrait phones only; landscape/iPad are a
// rarer miss not worth the extra image set for this app.
const APPLE_STARTUP_IMAGES = [
  { file: "iphone-se1-640x1136.png", width: 320, height: 568, ratio: 2 },
  { file: "iphone-8-750x1334.png", width: 375, height: 667, ratio: 2 },
  { file: "iphone-8-plus-1242x2208.png", width: 414, height: 736, ratio: 3 },
  { file: "iphone-x-1125x2436.png", width: 375, height: 812, ratio: 3 },
  { file: "iphone-xr-828x1792.png", width: 414, height: 896, ratio: 2 },
  { file: "iphone-xs-max-1242x2688.png", width: 414, height: 896, ratio: 3 },
  { file: "iphone-12-1170x2532.png", width: 390, height: 844, ratio: 3 },
  { file: "iphone-12-pro-max-1284x2778.png", width: 428, height: 926, ratio: 3 },
  { file: "iphone-14-pro-1179x2556.png", width: 393, height: 852, ratio: 3 },
  { file: "iphone-14-pro-max-1290x2796.png", width: 430, height: 932, ratio: 3 },
];

export const metadata: Metadata = {
  title: "FoodMate",
  description: "Share food and ingredients with people nearby.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodMate",
    startupImage: APPLE_STARTUP_IMAGES.map(({ file, width, height, ratio }) => ({
      url: `/splash/${file}`,
      media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
    })),
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
