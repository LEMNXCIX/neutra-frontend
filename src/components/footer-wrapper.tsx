'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/category.types";

export default function FooterWrapper({ minimal = false, tenantName, tenantLogo, footerDescription, socialLinks }: { minimal?: boolean; tenantName?: string | null; tenantLogo?: string | null; footerDescription?: string | null; socialLinks?: any[] | null }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (minimal) return;
    let cancelled = false;
    categoriesService.getAll().then((data) => {
      if (!cancelled) setCategories(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [minimal]);

  if (isAdminPage) return null;
  return <Footer minimal={minimal} tenantName={tenantName} tenantLogo={tenantLogo} footerDescription={footerDescription} socialLinks={socialLinks} initialCategories={categories} />;
}
