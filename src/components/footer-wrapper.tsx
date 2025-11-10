'use client';

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) return null;
  return <Footer />;
}
