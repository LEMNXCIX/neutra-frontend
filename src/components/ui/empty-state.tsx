import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, PackageOpen } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionHref,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-slide-up">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 bg-background border-2 border-border rounded-3xl flex items-center justify-center shadow-sm">
          <Icon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold tracking-tight mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-10 text-base leading-relaxed">
        {description}
      </p>
      
      {action ? (
        action
      ) : actionLabel && actionHref ? (
        <Button asChild size="lg" className="h-12 px-10 rounded-full font-bold shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
