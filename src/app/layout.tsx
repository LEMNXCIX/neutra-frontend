import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { AuthInitializer } from '@/components/auth-initializer';
import { Navigation as NavBar } from "@/components/nav_bar";
import { Toaster } from "@/components/ui/sonner";
import FooterWrapper from "@/components/footer-wrapper"; // 👈 nuevo componente cliente
import { QueryProvider } from '@/providers/query-provider';


const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neutra - Minimal Interiors",
  description: "Minimal interiors, mindful design — curated furniture and accessories with a clean aesthetic.",
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
          <AuthInitializer />
          <QueryProvider>
            <CartProvider>
              <div
                id="root-content"
                className="transition-all duration-300 ease-in-out"
                style={{
                  marginLeft: 'var(--sidebar-width, 0px)',
                } as React.CSSProperties}
              >
                <NavBar />
                <div className="pt-16">{children}</div>

                {/* 👇 Footer controlado desde un Client Component */}
                <FooterWrapper />

              </div>
              <Toaster richColors />
            </CartProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
