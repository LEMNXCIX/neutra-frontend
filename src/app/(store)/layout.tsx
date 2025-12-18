import { Navigation as NavBar } from "@/components/nav_bar";
import FooterWrapper from "@/components/footer-wrapper";

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
