"use client";
import React, { useState, useEffect } from "react";
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
  Badge,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleIcon,
  Search,
  ShoppingBagIcon,
  Menu,
  LayoutDashboard,
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
import categories from '@/data/categories.json';

type Category = { id: string; name: string, description: string };

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [konami, setKonami] = useState<string[]>([]);
  const [lastTap, setLastTap] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { count } = useCart();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    // Agregar efecto de giro al logo
    const logo = document.querySelector('#logo-svg');
    if (logo) {
      logo.classList.add('spin-once');
      setTimeout(() => logo.classList.remove('spin-once'), 500);
    }
  };

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
          // Easter egg triggered!
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

  // Secret sequence 'neutra' easter egg + console hint
  useEffect(() => {
    // console hint for devs / curious users
    console.log(`\n¡Has encontrado un huevo de pascua!\n🥚 Neutra tiene secretos ocultos...\nIntenta presionar estas teclas: ↑↑↓↓←→←→BA\n`);

    const seq = ['n', 'e', 'u', 't', 'r', 'a'];
    let buffer: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      buffer.push(e.key.toLowerCase());
      if (buffer.length > seq.length) buffer.shift();
      if (buffer.join('') === seq.join('')) {
        // trigger rainbow effect on brand name
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

  // Cart special: if user reaches exactly 7 items, show a secret
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
        {/* Left: logo */}
        <NavigationMenuList className="ml-0 mr-auto">
          <NavigationMenuItem>

            <div className="flex items-center gap-0">
              {/* custom logo */}
              <div
                className="text-zinc-900 dark:text-zinc-100 hover-scale cursor-pointer"
                onDoubleClick={handleThemeToggle}
                onTouchEnd={(e) => {
                  const now = Date.now();
                  const DOUBLE_TAP_DELAY = 1000; // ms
                  console.log('dsd')
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
        </NavigationMenuList>
        {/* Center: full menu - hidden on small and medium screens, visible on large+ */}
        <NavigationMenuList className="mx-auto hidden lg:flex">
          <NavigationMenuItem>
            <NavigationMenuTrigger>Productos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                      href="/products"
                    >
                      <div className="mt-4 mb-2 text-lg font-medium hover-elevate">
                        Ver productos
                      </div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        Verifica los productos que ofrecemos
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <ScrollArea className="max-h-50">
                  <ListItem href="/docs" title="Mas vendidos.">
                    Re-usable components built using Radix UI and Tailwind CSS.
                  </ListItem>
                  <ListItem href="/docs/installation" title="Recien llegados.">
                    How to install dependencies and structure your app.
                  </ListItem>
                  <ListItem href="/docs/primitives/typography" title="Descuentos.">
                    De hasta el 20%
                  </ListItem>
                </ScrollArea>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger >Categorias</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {(categories as Category[]).map((c) => {
                  const active = c.id === category;
                  // build link preserving search param
                  const href = c.id === 'all' ? `/products${search ? `?search=${encodeURIComponent(search)}` : ''}` : `/products?category=${encodeURIComponent(c.id)}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
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
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/docs" className="hover-slide-up inline-block">Docs</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>List</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="#">
                      <div className="font-medium">Components</div>
                      <div className="text-muted-foreground">
                        Browse all components in the library.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#">
                      <div className="font-medium">Documentation</div>
                      <div className="text-muted-foreground">
                        Learn how to use the library.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#">
                      <div className="font-medium">Blog</div>
                      <div className="text-muted-foreground">
                        Read our latest blog posts.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Simple</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="#">Components</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#">Documentation</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#">Blocks</Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="#" className="flex-row items-center gap-2">
                      <CircleHelpIcon />
                      Backlog
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#" className="flex-row items-center gap-2">
                      <CircleIcon />
                      To Do
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#" className="flex-row items-center gap-2">
                      <CircleCheckIcon />
                      Done
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        {/* Right: actions - compact on small screens */}
        <NavigationMenuList className="ml-auto mr-0 flex items-center gap-3">
          {/* Search (desktop only) */}
          <div className="hidden lg:flex items-center gap-3">
            <NavigationMenuItem>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // navigate to products with query param
                  const trimmed = query.trim();
                  const url = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products';
                  router.push(url);
                  setIsOpen(false);
                }}
              >
                <InputGroup>
                  <InputGroupInput
                    placeholder="Search products."
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  />
                  <InputGroupAddon>
                    <button type="submit" aria-label="Search">
                      <Search />
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </form>
            </NavigationMenuItem>
          </div>

          {/* Always visible actions: cart, login, avatar (compact on mobile) */}
          {user ? (
            <NavigationMenuItem>
              <Link href='/admin' className="relative flex items-center">
                <LayoutDashboard className="hover-scale click-pulse" />
              </Link>
            </NavigationMenuItem>
          ) : <></>}

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

          {user ? (
            <NavigationMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className="hover-scale">
                  <Avatar>
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
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
                    <button onClick={() => logout()}>Logout</button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavigationMenu>
          ) : (
            <NavigationMenuItem>
              <Link href="/login">
                <Button variant="ghost" className="text-sm px-3 py-1 hidden sm:inline-flex">Iniciar sesión</Button>
              </Link>
            </NavigationMenuItem>
          )}

          {/* Mobile: hamburger menu opens a left sidebar (drawer) */}
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

            {/* Sidebar drawer - mirrors desktop menu but vertically */}
            <aside
              className={`fixed top-0 left-0 z-50 h-svh w-72 backdrop-blur-lg bg-white/90 dark:bg-black/90 border border-white/10 rounded-r-2xl shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}

              aria-hidden={!isOpen}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center">
                  <span className="ml-2 font-medium">Menu</span>
                </div>
                <Button variant="ghost" onClick={() => setIsOpen(false)} aria-label="Close">
                  ×
                </Button>
              </div>
              <nav className="p-4">
                <ul className="flex flex-col gap-4">
                  <li>
                    <Link href="/products" onClick={() => setIsOpen(false)} className="text-base font-medium">Productos</Link>
                  </li>
                  <li>
                    <div className="text-sm font-medium mb-2">Categorias</div>
                    <div className="flex flex-col gap-2 pl-2">
                      {(categories as Category[]).map((c) => (
                        <Link key={c.id} href={c.id === 'all' ? '/products' : `/products?category=${encodeURIComponent(c.id)}`} onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground">{c.name}</Link>
                      ))}
                    </div>
                  </li>
                  <li>
                    <Link href="/docs" onClick={() => setIsOpen(false)} className="text-base font-medium">Docs</Link>
                  </li>
                  <li>
                    <Link href="/cart" onClick={() => setIsOpen(false)} className="text-base font-medium">Carrito</Link>
                  </li>
                  <li className="pt-4 border-t">
                    {user ? (
                      <div className="flex flex-col gap-2">
                        <Link href="/profile" onClick={() => setIsOpen(false)} className="text-sm">Mi perfil</Link>
                        <button onClick={() => { logout(); setIsOpen(false); }} className="text-sm text-left">Cerrar sesión</button>
                      </div>
                    ) : (
                      <Link href="/login" onClick={() => setIsOpen(false)} className="text-base font-medium">Iniciar sesión</Link>
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
        <Link href={href} className="hover-slide-up block p-2">
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
