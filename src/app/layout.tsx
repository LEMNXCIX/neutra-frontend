import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { Navigation as NavBar } from "@/components/nav_bar";
import Footer from '@/components/footer';
import { Toaster } from 'sonner';

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
      <body
        className={`${geist.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <NavBar />
              {/* Add top padding so fixed navbar doesn't cover page content on all screens */}
              <div className="pt-16">
                {children}
              </div>
              <Footer />
              <Toaster richColors />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
