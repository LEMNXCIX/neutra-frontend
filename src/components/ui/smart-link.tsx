"use client";

import { Link } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef } from "react";

const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

type SmartLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
    href: string;
};

/**
 * Renders absolute / cross-origin targets (cross-tenant URLs, CMS links,
 * mailto:) as plain anchors — TanStack's Link cannot buildLocation for them —
 * and keeps same-origin paths client-side. Embedded query strings are split
 * into TanStack's `search` option so the target route still matches.
 */
export function SmartLink({ href, children, ...rest }: SmartLinkProps) {
    if (EXTERNAL.test(href)) {
        return (
            <a href={href} {...rest}>
                {children}
            </a>
        );
    }

    const [path, query] = href.split("?");
    if (query !== undefined) {
        return (
            <Link
                to={path as never}
                search={Object.fromEntries(new URLSearchParams(query)) as never}
                {...(rest as object)}
            >
                {children}
            </Link>
        );
    }

    return (
        <Link to={href as never} {...(rest as object)}>
            {children}
        </Link>
    );
}

export default SmartLink;
