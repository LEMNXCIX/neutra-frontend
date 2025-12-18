import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { AuthInitializer } from '@/components/auth-initializer';
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from '@/providers/query-provider';
import { TenantProvider } from '@/context/tenant-context';


const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neutra - Your Business Platform",
  description: "E-Commerce and Booking solutions in one platform",
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
            <AuthInitializer />
            <QueryProvider>
              <CartProvider>
                {children}
                <Toaster richColors />
              </CartProvider>
            </QueryProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
