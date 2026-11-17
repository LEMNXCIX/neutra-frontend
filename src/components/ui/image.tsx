import React from "react";
import { cn } from "@/lib/utils";

type UiImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string | null;
    alt?: string;
    /** Mirrors the old next/image fill prop: absolute, fills the relative parent. */
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
};

/**
 * Plain <img> replacement for the next/image wrapper. `fill` is translated to
 * the same absolute-positioning utility classes next/image applied, so the
 * surrounding layout is unchanged.
 */
export default function UiImage({
    className,
    alt,
    src,
    fill,
    priority,
    sizes,
    ...props
}: UiImageProps) {
    const [error, setError] = React.useState(false);

    const isValidSrc = React.useMemo(() => {
        if (!src) return false;
        if (typeof src !== "string") return true;
        return (
            src.startsWith("/") ||
            src.startsWith("http") ||
            src.startsWith("data:")
        );
    }, [src]);

    if (error || !isValidSrc) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted text-muted-foreground",
                    className,
                )}
            >
                <span className="text-xs">Sin imagen</span>
            </div>
        );
    }

    return (
        <img
            {...props}
            src={src ?? undefined}
            alt={alt || ""}
            sizes={sizes}
            loading={priority ? "eager" : props.loading}
            fetchPriority={priority ? "high" : props.fetchPriority}
            className={cn(
                fill && "absolute inset-0 h-full w-full",
                "block object-cover transition-transform duration-200 hover-glow hover-scale",
                className,
            )}
            onError={() => setError(true)}
        />
    );
}
