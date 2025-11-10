"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelLeftIcon } from "lucide-react"

// Sidebar provider will sync a --sidebar-width CSS variable and
// set data-sidebar-expanded on the <body> element so the root layout
// can shift the entire page when the sidebar opens.

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  // Keep the document/body in sync so the root layout can shift when the
  // sidebar opens. This allows the entire page (navbar, content and footer)
  // to be pushed by the sidebar.
  React.useEffect(() => {
    try {
      // set a boolean attribute for simple CSS queries
      document.body.setAttribute('data-sidebar-expanded', String(open))
      // set a CSS variable with the sidebar width that the root layout uses
      document.documentElement.style.setProperty(
        '--sidebar-width',
        open && !isMobile ? '16rem' : '0px'
      )
    } catch {
      // SSR safety: ignore when document is not available
    }
    return () => {
      try {
        document.body.removeAttribute('data-sidebar-expanded')
        document.documentElement.style.removeProperty('--sidebar-width')
      } catch {}
    }
  }, [open, isMobile])

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-state={state}
        className={cn(
          "relative h-full transition-all duration-300 ease-in-out",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar()

  const sidebarClasses = cn(
    "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-background border-r",
    state === "expanded" ? "translate-x-0 w-64" : "-translate-x-full w-64",
    "lg:translate-x-0 lg:w-64 lg:shrink-0",
    className
  )

  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
          openMobile ? "opacity-100" : "opacity-0 pointer-events-none",
          "transition-opacity duration-300"
        )}
        onClick={() => setOpenMobile(false)}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r",
            "transform transition-transform duration-300",
            openMobile ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={sidebarClasses} {...props}>
      {children}
    </div>
  )
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 p-0"
      onClick={toggleSidebar}
    >
      <PanelLeftIcon className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1.5 p-6", className)} {...props} />
  )
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-auto", className)} {...props} />
  )
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-auto p-6", className)} {...props} />
  )
}