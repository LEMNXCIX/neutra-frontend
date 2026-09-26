/**
 * The backend publishes its error codes in
 * `api-neutra-v2/types/error-codes.ts` and says they exist "for better error
 * handling and client-side error display". This test is the contract check: if
 * a code is added there and not translated here, it fails.
 *
 * The sibling repo is read when present, which is the drift check on a dev
 * machine. When it is absent, as in a checkout of this repo alone, the
 * coverage assertions still run against the codes this module maps, so the suite
 * never breaks for a missing neighbour.
 */
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { errorMessageFrom, firstTranslatedError, resolutionFor, translateErrorDetail } from '@/lib/error-messages';

// src/lib/__tests__ -> src/lib -> src -> neutra-frontend -> Projects
const PROJECTS_DIR = resolve(__dirname, '../../../..');
const BACKEND_CODES = join(PROJECTS_DIR, 'api-neutra-v2/types/error-codes.ts');

const readPublishedCodes = (): string[] | null => {
    if (!existsSync(BACKEND_CODES)) return null;
    const source = readFileSync(BACKEND_CODES, 'utf8');
    const codes = new Set<string>();
    // Parse NAME = "WIRE_CODE" / NAME: "WIRE_CODE" pairs and take the value.
    // Matching on a known domain prefix instead would be circular: a brand new
    // domain could never be seen by a pattern that only knows the old ones.
    for (const match of source.matchAll(
        /^\s*[A-Z][A-Z0-9_]*\s*[:=]\s*["']([A-Z][A-Z0-9_]*)["']/gm,
    )) {
        codes.add(match[1]);
    }
    return [...codes];
};

describe('error message translation', () => {
    it('translates the reported case: short password', () => {
        const message = translateErrorDetail({
            code: 'VALIDATION_INVALID_FORMAT',
            message: 'password must be longer than or equal to 8 characters',
            field: 'password',
            domain: 'validation',
        });

        expect(message).toContain('contraseña');
        expect(message).not.toContain('password must be');
    });

    it('never surfaces the backend message', () => {
        const raw = 'password must be longer than or equal to 8 characters';
        const message = translateErrorDetail({
            code: 'AUTH_INVALID_CREDENTIALS',
            message: raw,
            field: 'password',
        });

        expect(message).not.toContain(raw);
        expect(message).not.toMatch(/must be/);
    });

    it('falls back by domain for a code it does not know', () => {
        const message = translateErrorDetail({
            code: 'BUSINESS_SOMETHING_BRAND_NEW',
            message: 'brand new backend rule',
        });

        expect(message).toBe('No pudimos completar la operación.');
        expect(message).not.toContain('brand new');
    });

    it('falls back safely for a malformed code', () => {
        expect(translateErrorDetail({ code: '', message: 'x' })).toBe(
            'No pudimos completar la operación.',
        );
    });

    it('ignores details with no code', () => {
        expect(
            firstTranslatedError([{ message: 'algo sin código' }]),
        ).toBeUndefined();
    });

    it('uses the caller fallback when there is nothing to translate', () => {
        expect(errorMessageFrom(new Error('boom'), 'Error al iniciar sesión')).toBe(
            'Error al iniciar sesión',
        );
        expect(errorMessageFrom(undefined, 'Error al iniciar sesión')).toBe(
            'Error al iniciar sesión',
        );
        expect(
            errorMessageFrom({ errors: [{ message: 'sin code' }] }, 'Copia en español'),
        ).toBe('Copia en español');
    });

    it('picks the first translatable detail from a list', () => {
        const message = firstTranslatedError([
            { code: '', message: 'ignorame' },
            { code: 'AUTH_TOKEN_EXPIRED', message: 'token expired' },
        ]);

        expect(message).toContain('sesión expiró');
    });
});

describe('coverage of the published backend codes', () => {
    const published = readPublishedCodes();

    it.skipIf(!published)(
        'every code the backend publishes resolves to real Spanish copy',
        () => {
            expect(published).not.toBeNull();
            const untranslated = (published as string[]).filter(
                (code) => resolutionFor(code) === 'none',
            );
            expect(
                untranslated,
                `códigos sin traducir: ${untranslated.join(', ')}`,
            ).toEqual([]);
        },
    );

    it.skipIf(!published)('never renders the raw backend message', () => {
        for (const code of published as string[]) {
            expect(translateErrorDetail({ code, message: 'raw backend text' })).not.toContain(
                'raw backend text',
            );
        }
    });

    it.skipIf(!published)('reads a non-trivial number of codes', () => {
        expect((published as string[]).length).toBeGreaterThan(50);
    });

    it('reports how each resolution was reached', () => {
        expect(resolutionFor('AUTH_INVALID_CREDENTIALS')).toBe('specific');
        expect(resolutionFor('AUTH_SOMETHING_NEW')).toBe('domain');
        expect(resolutionFor('NEWDOMAIN_WHATEVER')).toBe('none');
        expect(resolutionFor('')).toBe('none');
    });

    it('covers the codes this module maps explicitly', () => {
        // Runs without the sibling repo so the suite is self-contained.
        for (const code of [
            'AUTH_INVALID_CREDENTIALS',
            'VALIDATION_INVALID_FORMAT',
            'RESOURCE_ROUTE_NOT_FOUND',
            'TENANT_NOT_FOUND',
            'BUSINESS_INSUFFICIENT_STOCK',
            'LOYALTY_TARGET_NOT_REACHED',
            'RATE_LIMIT_EXCEEDED',
        ]) {
            expect(resolutionFor(code)).toBe('specific');
        }
    });
});
