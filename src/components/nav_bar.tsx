"use client";
import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/cart-context";
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
import { categoriesService } from '@/services/categories.service';
import { Category } from '@/types/category.types';
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

type Product = { id: string; name: string; price: number; image?: string; stock: number };

export function Navigation({ minimal = false }: { minimal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { count } = useCart();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const searchRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesService.getAll();
        setCategories(response || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);


  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&pageSize=5`);
        const data = await res.json();
        const list = data.data?.products || data.products || [];
        setSearchResults(list);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <NavigationMenu
      viewport={false}
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
        minimal ? 'h-24' : 'h-20'
      )}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 w-full h-full">
        {/* Left: logo + menu items */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-0">
            <div
              className="text-foreground hover:scale-105 transition-transform cursor-pointer group"
              onDoubleClick={handleThemeToggle}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <Logo size={minimal ? 40 : 32} className="relative z-10" />
              </div>
            </div>
            <Link href="/" className="ml-3">
              <div className="flex flex-col leading-tight">
                <span className={cn("font-bold tracking-tight text-foreground", minimal ? 'text-2xl' : 'text-lg')}>XCIX</span>
                {!minimal && <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Platform Core</span>}
              </div>
            </Link>
          </div>

          {/* Desktop Menu Items - Left aligned */}
          {!minimal && (
            <div className="hidden lg:flex items-center gap-1">
              <NavigationMenuItem className="list-none">
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent font-semibold text-xs tracking-tight hover:bg-muted transition-colors rounded-lg")}>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Catalog Categories</p>
                    </div>
                    {(Array.isArray(categories) ? categories : []).map((c) => {
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
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          {/* Search with dropdown results */}
          {!minimal && (
            <div className="hidden lg:flex items-center gap-3 relative" ref={searchRef}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = query.trim();
                    const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                    router.push(url);
                    setShowResults(false);
                    setQuery('');
                  }}
                  className="w-64"
                >
                  <div className="relative group">
                    <input
                      placeholder="Search catalog..."
                      value={query}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                      onFocus={() => query.length >= 2 && setShowResults(true)}
                      className="w-full h-10 bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background px-4 pr-10 text-sm font-medium outline-none transition-all rounded-full"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search size={16} />}
                    </div>
                  </div>
                </form>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <Card className="absolute top-full mt-3 w-[400px] border border-border shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="max-h-[480px]">
                      <div className="p-3 space-y-1">
                        <div className="px-4 py-2 border-b border-border mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Search Results</p>
                        </div>
                        {(Array.isArray(searchResults) ? searchResults : []).map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="flex items-center gap-4 p-3 hover:bg-muted transition-all rounded-xl group"
                            onClick={() => {
                              setShowResults(false);
                              setQuery('');
                            }}
                          >
                            <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={18} /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{product.name}</p>
                              <p className="text-xs font-semibold text-primary/80 tabular-nums">${product.price.toFixed(2)}</p>
                            </div>
                            {product.stock <= 0 && (
                              <Badge variant="destructive" className="text-[9px] rounded-full px-2">Out</Badge>
                            )}
                          </Link>
                        ))}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              router.push(`/products?search=${encodeURIComponent(query)}`);
                              setShowResults(false);
                              setQuery('');
                            }}
                            className="w-full text-xs font-bold text-primary hover:bg-primary/5 transition-all rounded-xl p-3 text-center"
                          >
                            View all results <ArrowRight className="inline ml-1 w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </ScrollArea>
                  </Card>
                )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Admin Dashboard Link */}
            {user?.isAdmin && (
                <Link href='/admin' className="p-2.5 hover:bg-muted transition-all rounded-full group">
                    <LayoutDashboard className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                </Link>
            )}

            {/* Cart */}
            {!minimal && (
                <Link href='/cart' className="relative p-2.5 hover:bg-muted transition-all rounded-full group">
                    <ShoppingBagIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    {count > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4.5 h-4.5 border-2 border-background">
                        {count}
                    </span>
                    )}
                </Link>
            )}

            {/* User Menu */}
            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger className="ml-1 outline-none">
                        <Avatar className="h-9 w-9 border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                            <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                            <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 border border-border shadow-2xl rounded-2xl mt-2" align="end">
                        <DropdownMenuLabel className="p-4 mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Account</p>
                            <p className="font-bold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground font-medium truncate">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="mx-2 bg-border/50" />
                        <DropdownMenuItem className="p-3 rounded-xl cursor-pointer focus:bg-muted" asChild>
                            <Link href="/profile" className="flex items-center gap-3 font-semibold text-sm w-full">
                                <User size={16} className="opacity-70" /> My Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="mx-2 bg-border/50" />
                        <DropdownMenuItem className="p-3 rounded-xl cursor-pointer focus:bg-rose-500/10 text-rose-600" onClick={async () => { await logout(); router.push('/'); }}>
                            <span className="font-bold text-sm">Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Link href="/login" className="ml-1">
                    <Button variant="default" className="h-10 rounded-full px-6 font-bold text-xs shadow-md shadow-primary/20">Sign In</Button>
                </Link>
            )}

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden ml-1">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 hover:bg-muted rounded-full"
                    >
                    <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[380px] p-0 flex flex-col border-l border-border bg-background rounded-l-3xl">
                    <SheetHeader className="p-8 border-b border-border text-left bg-muted/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-background border border-border shadow-sm rounded-2xl">
                            <Logo size={32} />
                        </div>
                        <div>
                        <SheetTitle className="text-2xl font-bold tracking-tight">XCIX</SheetTitle>
                        {!minimal && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Platform Core</p>}
                        </div>
                    </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    <nav className="flex flex-col space-y-8">
                        {!minimal && (
                        <>
                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Search Catalog</span>
                                <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const trimmed = query.trim();
                                    const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                                    router.push(url);
                                    setIsOpen(false);
                                }}
                                >
                                <div className="relative group">
                                    <input
                                    placeholder="What are you looking for?"
                                    value={query}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                                    className="w-full h-14 bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background px-5 pr-12 text-sm font-medium outline-none transition-all rounded-2xl"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
                                        <Search size={20} />
                                    </div>
                                </div>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Explore</span>
                                <div className="grid gap-3">
                                    <Link
                                    href="/products"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between p-5 bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all rounded-2xl group"
                                    >
                                    <span className="font-bold text-lg">Inventory Catalog</span>
                                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    </Link>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {(Array.isArray(categories) ? categories : []).slice(0, 4).map((c) => (
                                        <Link
                                            key={c.id}
                                            href={`/products?category=${encodeURIComponent(c.id)}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex flex-col gap-2 p-4 bg-muted/30 hover:bg-muted border border-transparent hover:border-border transition-all rounded-2xl"
                                        >
                                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Section</span>
                                            <span className="font-semibold text-sm truncate">{c.name}</span>
                                        </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                        )}
                    </nav>

                    <div className="space-y-6 pt-10 border-t border-border">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Account</span>
                        {user ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-card border border-border shadow-sm rounded-2xl">
                                <Avatar className="h-12 w-12 border border-border">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                    {user.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                    onClick={() => {
                                    setIsOpen(false);
                                    router.push('/profile');
                                    }}
                                >
                                    <span>Dashboard</span>
                                    <User size={18} className="opacity-60" />
                                </Button>
                                {user.isAdmin && (
                                    <Button
                                    variant="outline"
                                    className="w-full justify-between h-14 rounded-2xl px-6 font-bold text-sm"
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/admin');
                                    }}
                                    >
                                    <span>Control Center</span>
                                    <LayoutDashboard size={18} className="opacity-60" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full h-14 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-500/10 mt-2"
                                    onClick={async () => {
                                        await logout();
                                        setIsOpen(false);
                                        router.push('/');
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
                                onClick={() => { setIsOpen(false); router.push('/login'); }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 rounded-2xl font-bold border-border"
                                onClick={() => { setIsOpen(false); router.push('/register'); }}
                            >
                                Create Account
                            </Button>
                        </div>
                        )}
                    </div>
                    </div>

                    <div className="p-8 border-t border-border bg-muted/20 mt-auto">
                        <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest leading-relaxed">
                            &copy; 2026 XCIX Platforms.<br />All Rights Reserved.
                        </p>
                    </div>
                </SheetContent>
                </Sheet>
            </div>
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
        <Link href={href} className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-muted">
          <div className="text-sm font-bold leading-none">{title}</div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground font-medium">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
