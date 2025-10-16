"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { useAuth } from '@/context/auth-context';
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
} from "lucide-react";
import Link from "next/link";
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

type Category = { id: string; name: string, description: string};

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
  const router = useRouter();
  // use cart context (layout will wrap with provider)
  const { count, addItem, removeItem } = useCart();
  const { user, logout } = useAuth();

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
            <Link href="/">
              <div className="flex items-center gap-0">
                {/* custom logo */}
                <div className="text-zinc-900 dark:text-zinc-100">
                  <svg className="size-12" width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <rect x="4" y="4" width="56" height="56" rx="12" fill="currentColor" opacity="0" />
                    <path d="M 20 48.5 C 20 28.5 47 30.5 44 15.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="24" cy="26.5" r="5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex flex-col leading-none -right-5">
                  <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Neutra</span>
                  <span className="text-xs text-muted-foreground -mt-0.5">Minimal Interiors</span>
                </div>
              </div>
            </Link>

          </NavigationMenuItem>
        </NavigationMenuList>
        {/* Center: full menu - hidden on small screens */}
        <NavigationMenuList className="mx-auto hidden md:flex">
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
                      <div className="mt-4 mb-2 text-lg font-medium">
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
              <Link href="/docs">Docs</Link>
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
          <div className="hidden md:flex items-center gap-3">
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
          <NavigationMenuItem>
            <Link href='/cart'>
              <ShoppingBagIcon />
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
                <DropdownMenuTrigger>
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
          <div className="flex md:hidden items-center">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
            >
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
              className={`fixed top-0 left-0 z-50 h-full w-64 bg-white/95 dark:bg-black/90 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              aria-hidden={!isOpen}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center">
                  <Badge className="bg-pink-800 text-white" />
                  <span className="ml-2 font-medium">Neutra</span>
                </div>
                <Button variant="ghost" onClick={() => setIsOpen(false)} aria-label="Close">
                  ×
                </Button>
              </div>
              <nav className="p-4">
                <ul className="flex flex-col gap-3">
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  <li>
                    <Link href="/docs">Docs</Link>
                  </li>
                  <li>
                    <Link href="/cart">Cart</Link>
                  </li>
                  <li>
                    <Link href="/docs/primitives/typography">Components</Link>
                  </li>
                  <li className="pt-4 border-t">
                    {/* Demo controls to add/remove an item */}
                    <div className="flex gap-2">
                      <Button onClick={async () => { await addItem('p2', 'Demo product'); }}>Add demo</Button>
                      <Button variant="ghost" onClick={async () => { await removeItem('p2'); }}>Remove demo</Button>
                    </div>
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
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
