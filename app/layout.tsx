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
// apple-touch-startup-image, matched by exact CSS device-width/device-height/
// pixel-ratio (verified against current device specs, not guessed — several
// generations share the same panel and so the same breakpoint). Portrait
// phones only; landscape/iPad are a rarer miss not worth the extra image set.
const APPLE_STARTUP_IMAGES = [
  { file: "iphone-se1-640x1136.png", width: 320, height: 568, ratio: 2 }, // SE (1st gen)
  { file: "iphone-8-750x1334.png", width: 375, height: 667, ratio: 2 }, // 6/7/8, SE 2nd/3rd gen
  { file: "iphone-8-plus-1242x2208.png", width: 414, height: 736, ratio: 3 }, // 6/7/8 Plus
  { file: "iphone-x-1125x2436.png", width: 375, height: 812, ratio: 3 }, // X/XS/11 Pro, 12/13 mini
  { file: "iphone-xr-828x1792.png", width: 414, height: 896, ratio: 2 }, // XR, 11
  { file: "iphone-xs-max-1242x2688.png", width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { file: "iphone-12-1170x2532.png", width: 390, height: 844, ratio: 3 }, // 12/13
  { file: "iphone-12-pro-max-1284x2778.png", width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
  { file: "iphone-14-pro-1179x2556.png", width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { file: "iphone-14-pro-max-1290x2796.png", width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { file: "iphone-16-pro-1206x2622.png", width: 402, height: 874, ratio: 3 }, // 16 Pro, 17, 17 Pro
  { file: "iphone-16-pro-max-1320x2868.png", width: 440, height: 956, ratio: 3 }, // 16 Pro Max, 17 Pro Max
  { file: "iphone-air-1260x2736.png", width: 420, height: 912, ratio: 3 }, // Air
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
