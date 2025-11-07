"use client";
import Image, { type ImageProps } from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

export default function UiImage({ className, alt, ...props }: ImageProps & { className?: string; alt?: string }) {
  return (
    <Image {...props} alt={alt || ""} className={cn("block object-cover transition-transform duration-200 hover-glow hover-scale", className)} />
  );
}
