"use client";
import React, { useReducer, useEffect, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "next-themes";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu-trigger-style";
import {
    Search,
    ShoppingBagIcon,
    Menu,
    LayoutDashboard,
    X,
    Loader2,
    Calendar,
    User,
    ArrowRight,
    Package,
} from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/category.types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { tenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { getTenantUrl } from "@/lib/tenant";

type Product = {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
};

type NavigationState = {
    isOpen: boolean;
    query: string;
    searchResults: Product[];
    isSearching: boolean;
    showResults: boolean;
    lastTap: number;
    categories: Category[];
};

type NavigationAction =
    | { type: "SET_IS_OPEN"; payload: boolean }
    | { type: "SET_QUERY"; payload: string }
    | { type: "SET_SEARCH_RESULTS"; payload: Product[] }
    | { type: "SET_IS_SEARCHING"; payload: boolean }
    | { type: "SET_SHOW_RESULTS"; payload: boolean }
    | { type: "SET_LAST_TAP"; payload: number }
    | { type: "SET_CATEGORIES"; payload: Category[] };

function navigationReducer(
    state: NavigationState,
    action: NavigationAction,
): NavigationState {
    switch (action.type) {
        case "SET_IS_OPEN":
            return { ...state, isOpen: action.payload };
        case "SET_QUERY":
            return { ...state, query: action.payload };
        case "SET_SEARCH_RESULTS":
            return { ...state, searchResults: action.payload };
        case "SET_IS_SEARCHING":
            return { ...state, isSearching: action.payload };
        case "SET_SHOW_RESULTS":
            return { ...state, showResults: action.payload };
        case "SET_LAST_TAP":
            return { ...state, lastTap: action.payload };
        case "SET_CATEGORIES":
            return { ...state, categories: action.payload };
        default:
            return state;
    }
}

function DesktopMenuItems({ categories }: { categories: Category[] }) {
    return (
        <div className="hidden lg:flex items-center gap-1">
            <NavigationMenuItem className="list-none">
                <NavigationMenuLink
                    asChild
                    className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent font-semibold text-xs tracking-tight hover:bg-muted transition-colors rounded-lg",
                    )}
                >
                    <Link href="/products">Products</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem className="list-none">
                <NavigationMenuTrigger className="bg-transparent font-semibold text-xs tracking-tight hover:bg-muted transition-colors rounded-lg">
                    Collections
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-card border border-border shadow-xl rounded-2xl">
                        <div className="col-span-full border-b border-border pb-3 mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                Catalog Categories
                            </p>
                        </div>
                        {(Array.isArray(categories) ? categories : []).map(
                            (c) => {
                                const href = `/products?category=${encodeURIComponent(c.id)}`;
                                return (
                                    <ListItem
                                        key={c.id}
                                        title={c.name}
                                        href={href}
                                        className="rounded-xl hover:bg-muted transition-colors p-3"
                                    >
                                        {c.description}
                                    </ListItem>
                                );
                            },
                        )}
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </div>
    );
}

function DesktopSearchWithResults({
    query,
    isSearching,
    showResults,
    searchResults,
    dispatch,
    searchRef,
    router,
}: {
    query: string;
    isSearching: boolean;
    showResults: boolean;
    searchResults: Product[];
    dispatch: React.Dispatch<NavigationAction>;
    searchRef: React.RefObject<HTMLDivElement | null>;
    router: ReturnType<typeof useRouter>;
}) {
    return (
        <div
            className="hidden lg:flex items-center gap-3 relative"
            ref={searchRef}
        >
            <div role="search" className="w-64">
                <div className="relative group">
                    <input
                        placeholder="Search catalog..."
                        aria-label="Search catalog"
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            dispatch({
                                type: "SET_QUERY",
                                payload: e.target.value,
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const trimmed = query.trim();
                                const url = trimmed
                                    ? `/products?search=${encodeURIComponent(trimmed)}`
                                    : "/products";
                                router.push(url);
                                dispatch({
                                    type: "SET_SHOW_RESULTS",
                                    payload: false,
                                });
                                dispatch({ type: "SET_QUERY", payload: "" });
                            }
                        }}
                        onFocus={() =>
                            query.length >= 2 &&
                            dispatch({
                                type: "SET_SHOW_RESULTS",
                                payload: true,
                            })
                        }
                        className="w-full h-10 bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background px-4 pr-10 text-sm font-medium outline-none transition-all rounded-full"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {isSearching ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                    </div>
                </div>
            </div>

            {showResults && searchResults.length > 0 && (
                <Card className="absolute top-full mt-3 w-[400px] border border-border shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="max-h-[480px]">
                        <div className="p-3 space-y-1">
                            <div className="px-4 py-2 border-b border-border mb-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                    Search Results
                                </p>
                            </div>
                            {(Array.isArray(searchResults)
                                ? searchResults
                                : []
                            ).map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="flex items-center gap-4 p-3 hover:bg-muted transition-all rounded-xl group"
                                    onClick={() => {
                                        dispatch({
                                            type: "SET_SHOW_RESULTS",
                                            payload: false,
                                        });
                                        dispatch({
                                            type: "SET_QUERY",
                                            payload: "",
                                        });
                                    }}
                                >
                                    <div className="size-12 bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50">
                                        {product.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <Package size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                            {product.name}
                                        </p>
                                        <p className="text-xs font-semibold text-primary/80 tabular-nums">
                                            ${product.price.toFixed(2)}
                                        </p>
                                    </div>
                                    {product.stock <= 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="text-[9px] rounded-full px-2"
                                        >
                                            Out
                                        </Badge>
                                    )}
                                </Link>
                            ))}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.push(
                                            `/products?search=${encodeURIComponent(query)}`,
                                        );
                                        dispatch({
                                            type: "SET_SHOW_RESULTS",
                                            payload: false,
                                        });
                                        dispatch({
                                            type: "SET_QUERY",
                                            payload: "",
                                        });
                                    }}
                                    className="w-full text-xs font-bold text-primary hover:bg-primary/5 transition-all rounded-xl p-3 text-center"
                                >
                                    View all results{" "}
                                    <ArrowRight className="inline size-3.5" />
                                </button>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </div>
    );
}

function UserMenuDropdown({
    user,
    logout,
    router,
}: {
    user: { name: string; email?: string; avatar?: string; isAdmin?: boolean };
    logout: () => Promise<void>;
    router: ReturnType<typeof useRouter>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 outline-none">
                <Avatar className="size-9 border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                    <AvatarImage
                        src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
                        }
                    />
                    <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                        {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 p-2 border border-border shadow-2xl rounded-2xl mt-2"
                align="end"
            >
                <DropdownMenuLabel className="p-4 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                        Account
                    </p>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                        {user.email}
                    </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 bg-border/50" />
                <DropdownMenuItem
                    className="p-3 rounded-xl cursor-pointer focus:bg-muted"
                    asChild
                >
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 font-semibold text-sm w-full"
                    >
                        <User size={16} className="opacity-70" /> My Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="mx-2 bg-border/50" />
                <DropdownMenuItem
                    className="p-3 rounded-xl cursor-pointer focus:bg-rose-500/10 text-rose-600"
                    onClick={async () => {
                        await logout();
                        router.push("/");
                    }}
                >
                    <span className="font-bold text-sm">Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MobileMenuSheet({
    isOpen,
    query,
    categories,
    user,
    minimal,
    logout,
    router,
    dispatch,
}: {
    isOpen: boolean;
    query: string;
    categories: Category[];
    user: {
        name: string;
        email?: string;
        avatar?: string;
        isAdmin?: boolean;
    } | null;
    minimal: boolean;
    logout: () => Promise<void>;
    router: ReturnType<typeof useRouter>;
    dispatch: React.Dispatch<NavigationAction>;
}) {
    return (
        <div className="lg:hidden ml-1">
            <Sheet
                open={isOpen}
                onOpenChange={(v) =>
                    dispatch({ type: "SET_IS_OPEN", payload: v })
                }
            >
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 hover:bg-muted rounded-full"
                    >
                        <Menu className="size-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="right"
                    className="w-full sm:w-[380px] p-0 flex flex-col border-l border-border bg-background rounded-l-3xl"
                >
                    <SheetHeader className="p-8 border-b border-border text-left bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-background border border-border shadow-sm rounded-2xl">
                                <Logo size={32} />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold tracking-tight">
                                    XCIX
                                </SheetTitle>
                                {!minimal && (
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        Platform Core
                                    </p>
                                )}
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        <nav className="flex flex-col gap-8">
                            {!minimal && (
                                <>
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">
                                            Search Catalog
                                        </span>
                                        <div role="search">
                                            <div className="relative group">
                                                <input
                                                    placeholder="What are you looking for?"
                                                    aria-label="Search catalog"
                                                    value={query}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        dispatch({
                                                            type: "SET_QUERY",
                                                            payload:
                                                                e.target.value,
                                                        })
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const trimmed =
                                                                query.trim();
                                                            const url = trimmed
                                                                ? `/products?search=${encodeURIComponent(trimmed)}`
                                                                : "/products";
                                                            router.push(url);
                                                            dispatch({
                                                                type: "SET_IS_OPEN",
                                                                payload: false,
                                                            });
                                                        }
                                                    }}
                                                    className="w-full h-14 bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background px-5 pr-12 text-sm font-medium outline-none transition-all rounded-2xl"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
                                                    <Search size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">
                                            Explore
                                        </span>
                                        <div className="grid gap-3">
                                            <Link
                                                href="/products"
                                                onClick={() =>
                                                    dispatch({
                                                        type: "SET_IS_OPEN",
                                                        payload: false,
                                                    })
                                                }
                                                className="flex items-center justify-between p-5 bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all rounded-2xl group"
                                            >
                                                <span className="font-bold text-lg">
                                                    Inventory Catalog
                                                </span>
                                                <ArrowRight
                                                    size={20}
                                                    className="text-muted-foreground group-hover:text-primary transition-colors"
                                                />
                                            </Link>

                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                {(Array.isArray(categories)
                                                    ? categories
                                                    : []
                                                )
                                                    .slice(0, 4)
                                                    .map((c) => (
                                                        <Link
                                                            key={c.id}
                                                            href={`/products?category=${encodeURIComponent(c.id)}`}
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: "SET_IS_OPEN",
                                                                    payload: false,
                                                                })
                                                            }
                                                            className="flex flex-col gap-2 p-4 bg-muted/30 hover:bg-muted border border-transparent hover:border-border transition-all rounded-2xl"
                                                        >
                                                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                                                                Section
                                                            </span>
                                                            <span className="font-semibold text-sm truncate">
                                                                {c.name}
                                                            </span>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </nav>

                        <div className="space-y-6 pt-10 border-t border-border">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">
                                Account
                            </span>
                            {user ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-5 bg-card border border-border shadow-sm rounded-2xl">
                                        <Avatar className="size-12 border border-border">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                                {user.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-bold truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate font-medium">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                            onClick={() => {
                                                dispatch({
                                                    type: "SET_IS_OPEN",
                                                    payload: false,
                                                });
                                                router.push("/profile");
                                            }}
                                        >
                                            <span>Dashboard</span>
                                            <User
                                                size={18}
                                                className="opacity-60"
                                            />
                                        </Button>
                                        {user.isAdmin && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                                onClick={() => {
                                                    dispatch({
                                                        type: "SET_IS_OPEN",
                                                        payload: false,
                                                    });
                                                    router.push("/admin");
                                                }}
                                            >
                                                <span>Control Center</span>
                                                <LayoutDashboard
                                                    size={18}
                                                    className="opacity-60"
                                                />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="w-full h-14 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-500/10 mt-2"
                                            onClick={async () => {
                                                await logout();
                                                dispatch({
                                                    type: "SET_IS_OPEN",
                                                    payload: false,
                                                });
                                                router.push("/");
                                            }}
                                        >
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <Button
                                        className="h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                                        onClick={() => {
                                            dispatch({
                                                type: "SET_IS_OPEN",
                                                payload: false,
                                            });
                                            router.push("/login");
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl font-bold border-border"
                                        onClick={() => {
                                            dispatch({
                                                type: "SET_IS_OPEN",
                                                payload: false,
                                            });
                                            router.push("/register");
                                        }}
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 border-t border-border bg-muted/20 mt-auto">
                        <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest leading-relaxed">
                            &copy; 2026 XCIX Platforms.
                            <br />
                            All Rights Reserved.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

const EMPTY_CATEGORIES: Category[] = [];

export function Navigation({
    minimal = false,
    initialCategories = EMPTY_CATEGORIES,
}: {
    minimal?: boolean;
    initialCategories?: Category[];
}) {
    const [state, dispatch] = useReducer(navigationReducer, {
        isOpen: false,
        query: "",
        searchResults: [],
        isSearching: false,
        showResults: false,
        lastTap: 0,
        categories: initialCategories,
    });
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { count } = useCart();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const searchRef = useRef<HTMLDivElement>(null);

    const handleThemeToggle = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    useEffect(() => {
        const searchProducts = async () => {
            if (state.query.trim().length < 2) {
                dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
                dispatch({ type: "SET_SHOW_RESULTS", payload: false });
                return;
            }

            dispatch({ type: "SET_IS_SEARCHING", payload: true });
            try {
                const res = await fetch(
                    `/api/products?search=${encodeURIComponent(state.query)}&pageSize=5`,
                );
                const data = await res.json();
                const list = data.data?.products || data.products || [];
                dispatch({ type: "SET_SEARCH_RESULTS", payload: list });
                dispatch({ type: "SET_SHOW_RESULTS", payload: true });
            } catch (error) {
                console.error("Search error:", error);
                dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
            } finally {
                dispatch({ type: "SET_IS_SEARCHING", payload: false });
            }
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [state.query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                dispatch({ type: "SET_SHOW_RESULTS", payload: false });
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <NavigationMenu
            viewport={false}
            className={cn(
                "fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
                minimal ? "h-24" : "h-20",
            )}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 w-full h-full">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-0">
                        <div
                            className="text-foreground hover:scale-105 transition-transform cursor-pointer group"
                            onDoubleClick={handleThemeToggle}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Logo
                                    size={minimal ? 40 : 32}
                                    className="relative z-10"
                                />
                            </div>
                        </div>
                        <Link href="/" className="ml-3">
                            <div className="flex flex-col leading-tight">
                                <span
                                    className={cn(
                                        "font-bold tracking-tight text-foreground",
                                        minimal ? "text-2xl" : "text-lg",
                                    )}
                                >
                                    XCIX
                                </span>
                                {!minimal && (
                                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                                        Platform Core
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {!minimal && (
                        <DesktopMenuItems categories={state.categories} />
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {!minimal && (
                        <DesktopSearchWithResults
                            query={state.query}
                            isSearching={state.isSearching}
                            showResults={state.showResults}
                            searchResults={state.searchResults}
                            dispatch={dispatch}
                            searchRef={searchRef}
                            router={router}
                        />
                    )}

                    <div className="flex items-center gap-2">
                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                className="p-2.5 hover:bg-muted transition-all rounded-full group"
                            >
                                <LayoutDashboard className="size-5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                            </Link>
                        )}

                        {!minimal && (
                            <Link
                                href="/cart"
                                className="relative p-2.5 hover:bg-muted transition-all rounded-full group"
                            >
                                <ShoppingBagIcon className="size-5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                {count > 0 && (
                                    <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold size-4.5 border-2 border-background">
                                        {count}
                                    </span>
                                )}
                            </Link>
                        )}

                        {user ? (
                            <UserMenuDropdown
                                user={user}
                                logout={logout}
                                router={router}
                            />
                        ) : (
                            <Link href="/login" className="ml-1">
                                <Button
                                    variant="default"
                                    className="h-10 rounded-full px-6 font-bold text-xs shadow-md shadow-primary/20"
                                >
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        <MobileMenuSheet
                            isOpen={state.isOpen}
                            query={state.query}
                            categories={state.categories}
                            user={user}
                            minimal={minimal}
                            logout={logout}
                            router={router}
                            dispatch={dispatch}
                        />
                    </div>
                </div>
            </div>
        </NavigationMenu>
    );
}

function ListItem({
    title,
    children,
    href,
    ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-muted"
                >
                    <div className="text-sm font-bold leading-none">
                        {title}
                    </div>
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground font-medium">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}
