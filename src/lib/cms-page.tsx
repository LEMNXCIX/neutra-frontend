/** Shared helpers for CMS-driven static pages. */

const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderChildren(children: any[] = []): string {
    return children
        .map((c) => {
            let html =
                c.type === "link"
                    ? `<a href="${esc(c.url ?? "#")}" class="text-primary underline underline-offset-4">${renderChildren(c.children)}</a>`
                    : esc(c.text ?? "");
            if (c.bold) html = `<strong>${html}</strong>`;
            if (c.italic) html = `<em>${html}</em>`;
            if (c.underline) html = `<u>${html}</u>`;
            if (c.code) html = `<code class="bg-muted px-1 rounded">${html}</code>`;
            if (c.strikethrough) html = `<s>${html}</s>`;
            return html;
        })
        .join("");
}

/**
 * Strapi "blocks" rich text -> HTML.
 * # ponytail: covers paragraph/heading/list/quote/code/link/inline styles;
 * add a proper renderer if pages need images/embeds in rich text.
 */
export function blocksToHtml(blocks: any[] = []): string {
    return blocks
        .map((b) => {
            switch (b.type) {
                case "heading":
                    return `<h${b.level ?? 2} class="${b.level === 1 ? "text-3xl" : "text-2xl"} font-bold tracking-tight text-foreground mt-8 mb-4">${renderChildren(b.children)}</h${b.level ?? 2}>`;
                case "list": {
                    const items = (b.children ?? [])
                        .map(
                            (li: any) =>
                                `<li class="ml-6 list-disc">${renderChildren(li.children)}</li>`
                        )
                        .join("");
                    return `<ul class="space-y-2 my-4">${items}</ul>`;
                }
                case "quote":
                    return `<blockquote class="border-l-2 border-primary pl-6 italic text-xl text-foreground my-6">${renderChildren(b.children)}</blockquote>`;
                case "code":
                    return `<pre class="bg-muted rounded-lg p-4 overflow-x-auto text-sm my-4"><code>${esc(b.children?.map((c: any) => c.text).join("") ?? "")}</code></pre>`;
                default:
                    return `<p class="leading-relaxed my-4">${renderChildren(b.children)}</p>`;
            }
        })
        .join("");
}

/** Render repeatable rich-text components, or `fallback` HTML when empty. */
export function cmsRichText(content: any[] | null | undefined, fallback: string): string {
    const blocks = (content ?? []).flatMap((c: any) => c.content ?? []);
    return blocks.length ? blocksToHtml(blocks) : fallback;
}

/** Page header fields with fallbacks. */
export function cmsHeader(
    cms: any,
    fallback: { badge: string; title: string; highlight: string; subtitle: string }
) {
    return {
        badge: cms?.badge ?? fallback.badge,
        title: cms?.title ?? fallback.title,
        highlight: cms?.titleHighlight ?? fallback.highlight,
        subtitle: cms?.subtitle ?? fallback.subtitle,
    };
}
