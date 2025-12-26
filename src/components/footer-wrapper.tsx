'use client';

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

export default function FooterWrapper({ minimal = false }: { minimal?: boolean }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) return null;
  return <Footer minimal={minimal} />;
}
