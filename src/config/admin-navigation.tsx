
export interface NavItem {
    href: string;
    label: string;
    icon: string; // Changed to string
    exact?: boolean;
    adminOnly?: boolean;
    requiredFeature?: string;
    requiredFeatures?: string[];
}

export const STORE_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Panel", icon: "LayoutDashboard", exact: true },
    { href: "/admin/appearance", label: "Apariencia", icon: "Palette" },
    { href: "/admin/products", label: "Productos", icon: "Package" },
    { href: "/admin/categories", label: "Categorías", icon: "LayoutList" },
    { href: "/admin/banners", label: "Anuncios", icon: "Megaphone", requiredFeature: 'BANNERS' },
    { href: "/admin/sliders", label: "Carruseles", icon: "Images", requiredFeature: 'SLIDES' },
    { href: "/admin/orders", label: "Pedidos", icon: "ShoppingCart" },
    { href: "/admin/coupons", label: "Cupones", icon: "Ticket", requiredFeature: 'COUPONS' },
    { href: "/admin/users", label: "Usuarios", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield", adminOnly: true },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_API' },
];

export const BOOKING_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Panel", icon: "LayoutDashboard", exact: true },
    { href: "/admin/appearance", label: "Apariencia", icon: "Palette" },
    { href: "/admin/hours", label: "Horario", icon: "Clock" },
    { href: "/admin/appointments", label: "Citas", icon: "CalendarDays" },
    { href: "/admin/services", label: "Servicios", icon: "Scissors" },
    { href: "/admin/loyalty", label: "Fidelización", icon: "Gift", requiredFeatures: ["LOYALTY", "COUPONS"] },
    { href: "/admin/categories", label: "Categorías", icon: "LayoutList" },
    { href: "/admin/staff", label: "Personal", icon: "UserCog" },
    { href: "/admin/banners", label: "Anuncios", icon: "Megaphone", requiredFeature: 'BANNERS' },
    { href: "/admin/sliders", label: "Carruseles", icon: "Images", requiredFeature: 'SLIDES' },
    { href: "/admin/coupons", label: "Cupones", icon: "Ticket", requiredFeature: 'COUPONS' },
    { href: "/admin/users", label: "Usuarios", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield", adminOnly: true },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_API' },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Panel", icon: "LayoutDashboard", exact: true },
    { href: "/admin/tenants", label: "Organizaciones", icon: "Building" },
    { href: "/admin/features", label: "Funciones", icon: "Zap" },
    { href: "/admin/loyalty", label: "Fidelización", icon: "Gift" },
    { href: "/admin/appointments", label: "Citas", icon: "CalendarDays" },
    { href: "/admin/services", label: "Servicios", icon: "Scissors" },
    { href: "/admin/staff", label: "Personal", icon: "UserCog" },
    { href: "/admin/products", label: "Productos", icon: "Package" },
    { href: "/admin/categories", label: "Categorías", icon: "LayoutList" },
    { href: "/admin/coupons", label: "Cupones", icon: "Ticket" },
    { href: "/admin/banners", label: "Anuncios", icon: "Megaphone" },
    { href: "/admin/sliders", label: "Carruseles", icon: "Images" },
    { href: "/admin/users", label: "Todos los usuarios", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield" },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_API' },
    { href: "/admin/logs", label: "Registros del sistema", icon: "Terminal" },
];
