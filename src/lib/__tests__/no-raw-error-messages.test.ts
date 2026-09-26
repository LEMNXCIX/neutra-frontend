/**
 * Guards against the pattern that started this: a caught error's own `.message`
 * rendered to the user.
 *
 * That message is the backend's, forwarded verbatim by the BFF, and it is
 * written in English. The translatable half of the contract is the `code` in
 * `errors[]`, which reportError resolves. Anything matching here is either
 * bypassing that or leaking backend text.
 *
 * Server-side paths are excluded on purpose. In a route handler or a server
 * component the message is for a log or an internal error string, not the
 * screen, and `extractErrorMessage` in cart-store walks arbitrary response
 * shapes on purpose rather than translating them.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, relative, resolve } from 'path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../..');

/** Only client surfaces can put text in front of a user. */
const CLIENT_ROOTS = ['app/(store)', 'app/(booking)', 'components', 'providers', 'store', 'hooks'];
const SERVER_PREFIXES = ['app/api/', 'app/admin/', 'app/store-admin/', 'app/booking-admin/', 'app/onboarding/', 'app/profile/'];

const collect = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.next', '__tests__', 'examples'].includes(entry.name)) continue;
            collect(full, out);
        } else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
};

/** The shapes that mean "backend text straight to the screen". */
const LEAKS: Array<[RegExp, string]> = [
    [/toast\.error\([^)]*\b(?:err|error|e)\??\.message/, 'toast shows the thrown message'],
    [/setError\([^)]*\b(?:err|error|e)\??\.message/, 'inline state shows the thrown message'],
    [/\bpayload:\s*(?:err|error|e)\??\.message/, 'store payload shows the thrown message'],
    // Assigned first, toasted later: `const message = err instanceof ApiError ? err.message : "..."`
    // never puts the message inside a toast.error() call, so the patterns above
    // miss it. It is the most common shape in the admin tables.
    [
        /(?:const|let|var)\s+\w+\s*=\s*[^;\n]*\b(?:err|error|e)\s+instanceof\s+\w+\s*\?\s*(?:err|error|e)\.message/,
        'reads the thrown message into a local before showing it',
    ],
];

describe('no raw error message reaches the user', () => {
    const clientFiles = CLIENT_ROOTS.flatMap((root) => {
        const full = join(SRC, root);
        try {
            return collect(full);
        } catch {
            return [];
        }
    }).filter((file) => {
        const rel = relative(SRC, file).replace(/\\/g, '/');
        return !SERVER_PREFIXES.some((prefix) => rel.startsWith(prefix));
    });

    it('scans a meaningful number of client files', () => {
        expect(clientFiles.length).toBeGreaterThan(30);
    });

    it('has no toast, inline state or store payload rendering a thrown message', () => {
        const offenders: string[] = [];

        for (const file of clientFiles) {
            const source = readFileSync(file, 'utf8');
            for (const [pattern, label] of LEAKS) {
                if (pattern.test(source)) {
                    offenders.push(`${relative(SRC, file)}: ${label}`);
                }
            }
        }

        expect(
            offenders,
            `usá reportError() de @/lib/error-reporting:\n  ${offenders.join('\n  ')}`,
        ).toEqual([]);
    });

    it('does not import the removed use-api-error hook', () => {
        const offenders: string[] = [];
        for (const file of clientFiles) {
            if (/hooks\/use-api-error/.test(readFileSync(file, 'utf8'))) {
                offenders.push(relative(SRC, file));
            }
        }
        expect(offenders).toEqual([]);
    });
});
