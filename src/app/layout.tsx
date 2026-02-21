import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { AuthInitializer } from '@/components/auth-initializer';
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from '@/providers/query-provider';
import { TenantProvider } from '@/context/tenant-context';
import { FeatureProvider } from '@/providers/feature-provider';
import { SWRegistration } from '@/components/sw-registration';
import { ProgressBar } from '@/components/ui/progress-bar';


const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XCIX - Your Business Platform",
  description: "E-Commerce and Booking solutions in one platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "XCIX",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TenantProvider>
            <FeatureProvider>
              <SWRegistration />
              <ProgressBar />
              <AuthInitializer />
              <QueryProvider>
                <CartProvider>
                  {children}
                  <Toaster richColors />
                </CartProvider>
              </QueryProvider>
            </FeatureProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
