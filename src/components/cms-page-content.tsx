import React from "react";
import { getPageBySlug } from "@/lib/strapi";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Renders a tenant's CMS `page` (by slug) in a generic layout. When the
 * tenant has no CMS page (or Strapi is down) it renders `children` — the
 * original hardcoded page.
 *
 * # ponytail: blocks -> HTML string serializer covers paragraph/heading/
 * list/quote/code/link/inline styles only; add a proper renderer if pages
 * need images/embeds in rich text.
 */

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

function blocksToHtml(blocks: any[] = []): string {
    return blocks
        .map((b) => {
            switch (b.type) {
                case "heading":
                    return `<h${b.level ?? 2} class="${b.level === 1 ? "text-3xl" : "text-2xl"} font-bold tracking-tight text-foreground mt-8 mb-4">${renderChildren(b.children)}</h${b.level ?? 2}>`;
                case "list": {
                    const tag = b.format === "ordered" ? "ol" : "ul";
                    const items = b.children
                        .map(
                            (li: any) =>
                                `<li class="ml-6 list-disc">${renderChildren(li.children)}</li>`
                        )
                        .join("");
                    return `<${tag} class="space-y-2 my-4 ${tag === "ol" ? "list-decimal ml-6" : ""}">${items}</${tag}>`;
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

type FaqItem = { question: string; answer: any[] };

export default async function CmsPageContent({
    slug,
    children,
}: {
    slug: string;
    children: React.ReactNode;
}) {
    const page = await getPageBySlug(slug);
    if (!page) return <>{children}</>;

    const blocks: any[] = page.blocks ?? [];
    const faqs: FaqItem[] = blocks
        .filter((b) => b.__component === "shared.faq-item")
        .map((b) => ({ question: b.question, answer: b.answer ?? [] }));
    const richBlocks = blocks.filter(
        (b) => b.__component === "shared.rich-text"
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-12">
                {page.title ?? slug}
            </h1>
            <div className="space-y-8 text-lg text-muted-foreground font-medium">
                {richBlocks.map((b: any, i: number) => (
                    <div
                        key={i}
                        dangerouslySetInnerHTML={{
                            __html: blocksToHtml(b.content),
                        }}
                    />
                ))}
            </div>
            {faqs.length > 0 && (
                <Accordion type="single" collapsible className="w-full mt-12">
                    {faqs.map((f, i) => (
                        <AccordionItem value={`faq-${i}`} key={i}>
                            <AccordionTrigger>{f.question}</AccordionTrigger>
                            <AccordionContent>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: blocksToHtml(f.answer),
                                    }}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
