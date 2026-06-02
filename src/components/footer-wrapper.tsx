'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import { categoriesService } from "@/services/categories.service";
import { Category } from "@/types/category.types";

export default function FooterWrapper({ minimal = false }: { minimal?: boolean }) {
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
  return <Footer minimal={minimal} initialCategories={categories} />;
}
