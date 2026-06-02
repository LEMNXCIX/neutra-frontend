"use client";
import Image, { type ImageProps } from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

export default function UiImage({
    className,
    alt,
    src,
    ...props
}: ImageProps & { className?: string; alt?: string }) {
    const [error, setError] = React.useState(false);

    const isValidSrc = React.useMemo(() => {
        if (!src) return false;
        if (typeof src !== "string") return true;
        if (
            src.startsWith("/") ||
            src.startsWith("http") ||
            src.startsWith("data:")
        )
            return true;
        return false;
    }, [src]);

    if (error || !isValidSrc) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted text-muted-foreground",
                    className,
                )}
            >
                <span className="text-xs">No Image</span>
            </div>
        );
    }

    return (
        <Image
            {...props}
            src={src}
            alt={alt || ""}
            className={cn(
                "block object-cover transition-transform duration-200 hover-glow hover-scale",
                className,
            )}
            onError={() => setError(true)}
        />
    );
}
