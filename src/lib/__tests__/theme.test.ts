// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from 'vitest';
import {
    applyTenantTheme,
    clearTenantTheme,
    ensureFontLoaded,
    ALL_THEME_VARS,
    DEFAULT_BRANDING,
} from '@/lib/theme';

beforeEach(() => {
    clearTenantTheme();
    document.head.innerHTML = '';
});

describe('applyTenantTheme', () => {
    it('sets only the explicitly configured tokens', () => {
        applyTenantTheme({ primaryColor: '#7c3aed' });

        expect(
            document.documentElement.style.getPropertyValue('--primary'),
        ).toBe('#7c3aed');
        expect(
            document.documentElement.style.getPropertyValue('--background'),
        ).toBe('');
    });

    it('pins derived input/ring and surface tokens against dark leaks', () => {
        applyTenantTheme({ primaryColor: '#7c3aed', border: '#eee' });

        expect(
            document.documentElement.style.getPropertyValue('--ring'),
        ).toBe('#7c3aed');
        expect(
            document.documentElement.style.getPropertyValue('--input'),
        ).toBe('#eee');
        expect(
            document.documentElement.style.getPropertyValue('--card'),
        ).toContain('color-mix');
        expect(
            document.documentElement.style.getPropertyValue('--sidebar-primary'),
        ).toBe('var(--primary)');
    });

    it('ignores empty-string tokens', () => {
        applyTenantTheme({ primaryColor: '  ' });
        expect(
            document.documentElement.style.getPropertyValue('--primary'),
        ).toBe('');
    });
});

describe('clearTenantTheme', () => {
    it('removes every themed property', () => {
        applyTenantTheme({
            primaryColor: '#7c3aed',
            fontFamily: 'Poppins',
            headingFont: 'Poppins',
        });

        clearTenantTheme();

        for (const cssVar of ALL_THEME_VARS) {
            expect(
                document.documentElement.style.getPropertyValue(cssVar),
            ).toBe('');
        }
        expect(
            document.documentElement.style.getPropertyValue('--font-tenant-font'),
        ).toBe('');
    });
});

describe('ensureFontLoaded', () => {
    it('injects a Google Fonts stylesheet once per family', () => {
        ensureFontLoaded('Playfair Display');
        ensureFontLoaded('Playfair Display');

        const links = document.head.querySelectorAll(
            'link[id="tenant-font-playfair-display"]',
        );
        expect(links).toHaveLength(1);
        expect(links[0].getAttribute('href')).toContain('Playfair+Display');
    });
});

describe('DEFAULT_BRANDING', () => {
    it('keeps the editor prefills in sync with the site palette', () => {
        expect(DEFAULT_BRANDING.radius).toBe('0.75rem');
        expect(DEFAULT_BRANDING.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    });
});
