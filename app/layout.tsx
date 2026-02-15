import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationTracker } from "@/components/navigation-tracker";
import { SuppressWarnings } from "@/components/suppress-warnings";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {

  title: {
    default: "VehicleClaim AI - AI-Powered Vehicle Damage Assessment",
    template: "%s | VehicleClaim AI",
  },
  description:
    "AI-powered vehicle damage assessment platform for insurance companies and car owners. Instant damage detection, cost estimation, and fraud prevention with Gemini 2.5 Flash.",
  keywords: [
    "vehicle insurance",
    "AI damage assessment",
    "claim processing",
    "fraud detection",
    "auto insurance",
    "vehicle damage",
    "cost estimation",
  ],
  authors: [{ name: "VehicleClaim AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vehicleclaim.ai",
    title: "VehicleClaim AI - AI-Powered Vehicle Damage Assessment",
    description:
      "Process insurance claims in minutes with AI video analysis. Instant damage assessment, cost estimation, fraud detection.",
    siteName: "VehicleClaim AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "VehicleClaim AI - AI-Powered Vehicle Damage Assessment",
    description: "Process insurance claims in minutes with AI video analysis.",
  },
};
export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  // You can also define width/initialScale here if needed
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        vaul-drawer-wrapper=""
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SuppressWarnings />
          <NavigationTracker />
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
