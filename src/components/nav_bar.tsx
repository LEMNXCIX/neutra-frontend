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
} from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";
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
import { categoriesService } from '@/services/categories.service';
import { Category } from '@/types/category.types';

type Product = { id: string; name: string; price: number; image?: string; stock: number };

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [konami, setKonami] = useState<string[]>([]);
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
    const logo = document.querySelector('#logo-svg');
    if (logo) {
      logo.classList.add('spin-once');
      setTimeout(() => logo.classList.remove('spin-once'), 500);
    }
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
        setSearchResults(data.products || []);
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Konami code easter egg
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    const handleKeyDown = (e: KeyboardEvent) => {
      setKonami(prev => {
        const newKonami = [...prev, e.key];
        if (newKonami.length > konamiCode.length) {
          newKonami.shift();
        }

        if (newKonami.join(',') === konamiCode.join(',')) {
          document.body.style.animation = 'spin 1s linear';
          setTimeout(() => {
            document.body.style.animation = '';
          }, 1000);
        }

        return newKonami;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret sequence 'neutra' easter egg
  useEffect(() => {
    console.log(`\n¡Has encontrado un huevo de pascua!\n🥚 Neutra tiene secretos ocultos...\nIntenta presionar estas teclas: ↑↑↓↓←→←→BA\n`);

    const seq = ['n', 'e', 'u', 't', 'r', 'a'];
    let buffer: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      if (!e.key) return;
      buffer.push(e.key.toLowerCase());
      if (buffer.length > seq.length) buffer.shift();
      if (buffer.join('') === seq.join('')) {
        const el = document.querySelector('#brand-name');
        if (el) {
          el.classList.add('rainbow-text');
          setTimeout(() => el.classList.remove('rainbow-text'), 3000);
          toast('Easter egg: Neutra unlocked!');
        }
        buffer = [];
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Cart special: if user reaches exactly 7 items
  useEffect(() => {
    if (count === 7) {
      toast('🎉 Easter egg: you added 7 items!');
    }
  }, [count]);

  const getParam = (k: string) => {
    const v = null;
    if (!v) return '';
    return Array.isArray(v) ? v[0] : v;
  };
  const search = getParam('search') || '';
  const category = getParam('category') || 'all';

  return (
    <NavigationMenu
      viewport={false}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur bg-white/60 dark:bg-black/40 border-b border-transparent/10"
    >
      <div className="mx-auto flex justify-between items-center px-5 py-3 max-w-7xl w-full">
        {/* Left: logo + menu items */}
        <NavigationMenuList className="flex items-center gap-8">
          <NavigationMenuItem>
            <div className="flex items-center gap-0">
              <div
                className="text-zinc-900 dark:text-zinc-100 hover-scale cursor-pointer"
                onDoubleClick={handleThemeToggle}
                onTouchEnd={(e) => {
                  const now = Date.now();
                  const DOUBLE_TAP_DELAY = 1000;
                  if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
                    handleThemeToggle();
                    setLastTap(0);
                  } else {
                    setLastTap(now);
                  }
                }}
              >
                <svg
                  id="logo-svg"
                  className="size-12"
                  width="36"
                  height="36"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <rect x="4" y="4" width="56" height="56" rx="12" fill="currentColor" opacity="0" />
                  <path d="M 20 48.5 C 20 28.5 47 30.5 44 15.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="26.5" r="5" fill="currentColor" />
                </svg>
              </div>
              <Link href="/">
                <div className="flex flex-col leading-none -right-5">
                  <span id="brand-name" className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Neutra</span>
                  <span className="text-xs text-muted-foreground -mt-0.5">Minimal Interiors</span>
                </div>
              </Link>
            </div>
          </NavigationMenuItem>

          {/* Desktop Menu Items - Left aligned */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/products" className="hover-slide-up inline-block">Products</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {categories.map((c) => {
                    const active = c.id === category;
                    const href = `/products?category=${encodeURIComponent(c.id)}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
                    return (
                      <ListItem
                        key={c.id}
                        title={c.name}
                        href={href}
                      >
                        {c.description}
                      </ListItem>
                    );
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </div>
        </NavigationMenuList>

        {/* Right: actions */}
        <NavigationMenuList className="ml-auto mr-0 flex items-center gap-3">
          {/* Search with dropdown results */}
          <div className="hidden lg:flex items-center gap-3 relative" ref={searchRef}>
            <NavigationMenuItem>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = query.trim();
                  const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                  router.push(url);
                  setShowResults(false);
                  setQuery('');
                }}
              >
                <InputGroup>
                  <InputGroupInput
                    placeholder="Search products..."
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                  />
                  <InputGroupAddon>
                    <button type="submit" aria-label="Search">
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search />}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </form>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <Card className="absolute top-full mt-2 w-96 max-h-96 overflow-hidden shadow-xl z-50">
                  <ScrollArea className="max-h-96">
                    <div className="p-2">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => {
                            setShowResults(false);
                            setQuery('');
                          }}
                        >
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBagIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                          </div>
                          {product.stock <= 0 && (
                            <span className="text-xs text-red-500">Out of stock</span>
                          )}
                        </Link>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <button
                          onClick={() => {
                            router.push(`/products?search=${encodeURIComponent(query)}`);
                            setShowResults(false);
                            setQuery('');
                          }}
                          className="w-full text-sm text-center p-2 hover:bg-muted rounded transition-colors text-primary font-medium"
                        >
                          View all results
                        </button>
                      </div>
                    </div>
                  </ScrollArea>
                </Card>
              )}
            </NavigationMenuItem>
          </div>

          {/* Admin Dashboard Link */}
          {user?.isAdmin && (
            <NavigationMenuItem>
              <Link href='/admin' className="relative flex items-center">
                <LayoutDashboard className="hover-scale click-pulse" />
              </Link>
            </NavigationMenuItem>
          )}

          {/* Cart */}
          <NavigationMenuItem>
            <Link href='/cart' className="relative flex items-center">
              <ShoppingBagIcon className="hover-scale click-pulse" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-xs w-5 h-5">
                  {count}
                </span>
              )}
            </Link>
          </NavigationMenuItem>

          {/* User Menu */}
          {user ? (
            <NavigationMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className="hover-scale">
                  <Avatar>
                    <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <button onClick={async () => { await logout(); router.push('/'); }}>Logout</button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavigationMenu>
          ) : (
            <NavigationMenuItem>
              <Link href="/login">
                <Button variant="ghost" className="text-sm px-3 py-1 hidden sm:inline-flex">Sign In</Button>
              </Link>
            </NavigationMenuItem>
          )}

          {/* Mobile: hamburger menu */}
          <div className="flex lg:hidden items-center">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
              className="hover-scale click-pulse">
              <Menu />
            </Button>

            {/* Overlay */}
            {isOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setIsOpen(false)}
                aria-hidden
              />
            )}

            {/* Sidebar drawer */}
            <aside
              className={`fixed top-0 left-0 z-50 h-svh w-72 backdrop-blur-lg bg-white/90 dark:bg-black/90 border border-white/10 rounded-r-2xl shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
              aria-hidden={!isOpen}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center">
                  <span className="ml-2 font-medium">Menu</span>
                </div>
                <Button variant="ghost" onClick={() => setIsOpen(false)} aria-label="Close">
                  <X />
                </Button>
              </div>
              <nav className="p-4">
                <ul className="flex flex-col gap-4">
                  {/* Mobile Search */}
                  <li className="pb-4 border-b">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = query.trim();
                        const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                        router.push(url);
                        setIsOpen(false);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 rounded-md border bg-background text-sm"
                      />
                      <Button type="submit" size="sm" className="flex-shrink-0 px-3">
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </li>
                  <li>
                    <Link href="/products" onClick={() => setIsOpen(false)} className="text-base font-medium">Products</Link>
                  </li>
                  <li>
                    <div className="text-sm font-medium mb-2">Categories</div>
                    <div className="flex flex-col gap-2 pl-2">
                      {categories.map((c) => (
                        <Link key={c.id} href={`/products?category=${encodeURIComponent(c.id)}`} onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground">{c.name}</Link>
                      ))}
                    </div>
                  </li>
                  <li>
                    <Link href="/cart" onClick={() => setIsOpen(false)} className="text-base font-medium">Cart</Link>
                  </li>
                  <li className="pt-4 border-t">
                    {user ? (
                      <div className="flex flex-col gap-2">
                        <Link href="/profile" onClick={() => setIsOpen(false)} className="text-sm">My Profile</Link>
                        {user.isAdmin && (
                          <Link href="/admin" onClick={() => setIsOpen(false)} className="text-sm">Admin Dashboard</Link>
                        )}
                        <button onClick={async () => { await logout(); setIsOpen(false); router.push('/'); }} className="text-sm text-left">Sign Out</button>
                      </div>
                    ) : (
                      <Link href="/login" onClick={() => setIsOpen(false)} className="text-base font-medium">Sign In</Link>
                    )}
                  </li>
                </ul>
              </nav>
            </aside>
          </div>
        </NavigationMenuList>
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
        <Link href={href} className="hover-slide-up block p-3 rounded-lg hover:bg-muted transition-colors">
          <div className="text-sm leading-none font-medium mb-1">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
