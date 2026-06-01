import { Navigation as NavBar } from "@/components/nav_bar";
import FooterWrapper from "@/components/footer-wrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse our products and services",
};

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            id="root-content"
            className="transition-all duration-300 ease-in-out"
            style={{
                marginLeft: 'var(--sidebar-width, 0px)',
            } as React.CSSProperties}
        >
            <NavBar />
            <div className="pt-16">{children}</div>
            <FooterWrapper />
        </div>
    );
}
