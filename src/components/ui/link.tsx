"use client";
import Link, { type LinkProps } from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

export default function UiLink({ className, children, ...props }: LinkProps & { className?: string; children?: React.ReactNode }) {
  return (
    <Link {...props} className={cn("inline-block transition-colors duration-200 hover-scale click-pulse", className)}>
      {children}
    </Link>
  );
}
