"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/new-sidebar";

export function RootWrapper({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar();
  const isOpen = state === "expanded";

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isOpen ? "lg:ml-64" : "lg:ml-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}