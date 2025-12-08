"use client";
import Image, { type ImageProps } from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

export default function UiImage({ className, alt, ...props }: ImageProps & { className?: string; alt?: string }) {
  const [error, setError] = React.useState(false);

  // Validate src if it's a string
  const isValidSrc = React.useMemo(() => {
    if (!props.src) return false;
    if (typeof props.src !== 'string') return true; // Imported image object
    if (props.src.startsWith('/') || props.src.startsWith('http') || props.src.startsWith('data:')) return true;
    return false;
  }, [props.src]);

  if (error || !isValidSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <span className="text-xs">No Image</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt || ""}
      className={cn("block object-cover transition-transform duration-200 hover-glow hover-scale", className)}
      onError={() => setError(true)}
    />
  );
}
