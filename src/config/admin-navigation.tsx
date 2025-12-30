
export interface NavItem {
    href: string;
    label: string;
    icon: string; // Changed to string
    exact?: boolean;
    adminOnly?: boolean;
    requiredFeature?: string;
}

export const STORE_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true },
    { href: "/admin/products", label: "Products", icon: "Package" },
    { href: "/admin/categories", label: "Categories", icon: "LayoutList" },
    { href: "/admin/banners", label: "Banners", icon: "Megaphone", requiredFeature: 'BANNERS' },
    { href: "/admin/sliders", label: "Sliders", icon: "Images", requiredFeature: 'BANNERS' },
    { href: "/admin/orders", label: "Orders", icon: "ShoppingCart", requiredFeature: 'ORDERS' },
    { href: "/admin/coupons", label: "Coupons", icon: "Ticket", requiredFeature: 'COUPONS' },
    { href: "/admin/users", label: "Users", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield", adminOnly: true },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_NOTIFICATIONS' },
];

export const BOOKING_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true },
    { href: "/admin/appointments", label: "Appointments", icon: "CalendarDays", requiredFeature: 'APPOINTMENTS' },
    { href: "/admin/services", label: "Services", icon: "Scissors" },
    { href: "/admin/categories", label: "Categories", icon: "LayoutList" },
    { href: "/admin/staff", label: "Staff", icon: "UserCog" },
    { href: "/admin/coupons", label: "Coupons", icon: "Ticket", requiredFeature: 'COUPONS' },
    { href: "/admin/users", label: "Users", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield", adminOnly: true },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_NOTIFICATIONS' },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true },
    { href: "/admin/tenants", label: "Tenants", icon: "Building" },
    { href: "/admin/features", label: "Features", icon: "Zap" },
    { href: "/admin/appointments", label: "Appointments", icon: "CalendarDays" },
    { href: "/admin/services", label: "Services", icon: "Scissors" },
    { href: "/admin/staff", label: "Staff", icon: "UserCog" },
    { href: "/admin/products", label: "Products", icon: "Package" },
    { href: "/admin/categories", label: "Categories", icon: "LayoutList" },
    { href: "/admin/coupons", label: "Coupons", icon: "Ticket" },
    { href: "/admin/banners", label: "Banners", icon: "Megaphone" },
    { href: "/admin/sliders", label: "Sliders", icon: "Images" },
    { href: "/admin/users", label: "All Users", icon: "Users" },
    { href: "/admin/roles", label: "Roles", icon: "BrickWallShield" },
    { href: "/admin/whatsapp", label: "WhatsApp", icon: "MessageSquare", requiredFeature: 'WHATSAPP_NOTIFICATIONS' },
    { href: "/admin/logs", label: "System Logs", icon: "Terminal" },
];
