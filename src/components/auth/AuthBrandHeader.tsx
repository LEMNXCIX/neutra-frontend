"use client";

import Logo from "@/components/logo";

type AuthBrandHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthBrandHeader({ title, subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center size-16 rounded-xl bg-primary/10 text-primary mb-2 transition-transform hover:scale-110 duration-500 shadow-sm">
        <Logo size={36} />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted-foreground font-medium text-sm">{subtitle}</p>
      </div>
    </div>
  );
}
