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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


type Product = { id: string; name: string; price: number; image?: string; stock: number };

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // const [konami, setKonami] = useState<string[]>([]);
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
  // useEffect(() => {
  //   const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // setKonami(prev => {
  //     //   const newKonami = [...prev, e.key];
  //     //   if (newKonami.length > konamiCode.length) {
  //     //     newKonami.shift();
  //     //   }

  //     //   if (newKonami.join(',') === konamiCode.join(',')) {
  //     //     document.body.style.animation = 'spin 1s linear';
  //     //     setTimeout(() => {
  //     //       document.body.style.animation = '';
  //     //     }, 1000);
  //     //   }

  //     //   return newKonami;
  //     // });
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, []);

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

  // const getParam = (_k: string) => {
  //   const v = null;
  //   if (!v) return '';
  //   return Array.isArray(v) ? v[0] : v;
  // };
  // const search = '';
  // const category = 'all';

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
                onTouchEnd={() => {
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
                    // const active = c.id === category;
                    const href = `/products?category=${encodeURIComponent(c.id)}`;
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
                              /* eslint-disable-next-line @next/next/no-img-element */
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
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Open menu"
                  className="hover-scale click-pulse"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b text-left">
                  <div className="flex items-center gap-2">
                    <div className="size-8 text-primary">
                      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path d="M 20 48.5 C 20 28.5 47 30.5 44 15.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="24" cy="26.5" r="5" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-bold tracking-tight">Neutra</SheetTitle>
                      <p className="text-xs text-muted-foreground -mt-1">Minimal Interiors</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <nav className="flex flex-col space-y-1">
                    <span className="text-xs font-bold text-muted-foreground mb-3 px-4 uppercase">Search</span>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = query.trim();
                        const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                        router.push(url);
                        setIsOpen(false);
                      }}
                      className="px-4 mb-4"
                    >
                      <InputGroup>
                        <InputGroupInput
                          placeholder="Search..."
                          value={query}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        />
                        <InputGroupAddon>
                          <button type="submit">
                            <Search className="h-4 w-4" />
                          </button>
                        </InputGroupAddon>
                      </InputGroup>
                    </form>

                    <span className="text-xs font-bold text-muted-foreground mb-3 px-4 uppercase">Navigation</span>
                    <Link
                      href="/products"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-4 text-base font-semibold transition-all duration-200 rounded-2xl hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      All Products
                    </Link>

                    <div className="space-y-4 pt-4">
                      <span className="text-xs font-bold text-muted-foreground px-4 uppercase">Categories</span>
                      <div className="grid gap-1">
                        {categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/products?category=${encodeURIComponent(c.id)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>

                  <div className="space-y-6">
                    <span className="text-xs font-bold text-muted-foreground px-4 uppercase">Account</span>
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/50 border border-border">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                            <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-bold truncate text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start h-12 rounded-2xl px-4 font-semibold text-foreground/80"
                            onClick={() => {
                              setIsOpen(false);
                              router.push('/profile');
                            }}
                          >
                            <User className="mr-3 h-5 w-5 text-primary" />
                            My Profile
                          </Button>
                          {user.isAdmin && (
                            <Button
                              variant="outline"
                              className="w-full justify-start h-12 rounded-2xl px-4 font-semibold text-foreground/80"
                              onClick={() => {
                                setIsOpen(false);
                                router.push('/admin');
                              }}
                            >
                              <LayoutDashboard className="mr-3 h-5 w-5 text-primary" />
                              Admin Dashboard
                            </Button>
                          )}
                          <div className="pt-4 mt-4 border-t border-border">
                            <Button
                              variant="ghost"
                              className="w-full justify-center h-12 rounded-2xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                      </div>
                    ) : (
                      <div className="grid gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="h-14 rounded-2xl border-2 font-bold"
                          onClick={() => { setIsOpen(false); router.push('/login'); }}
                        >
                          Sign In
                        </Button>
                        <Button
                          className="h-14 rounded-2xl shadow-xl shadow-primary/20 font-bold text-base"
                          onClick={() => { setIsOpen(false); router.push('/products'); }}
                        >
                          Shop Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 border-t bg-muted/20">
                  <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Neutra Platforms
                  </p>
                </div>
              </SheetContent>
            </Sheet>
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
