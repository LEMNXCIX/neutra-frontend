import { describe, expect, it } from 'vitest';
import { getTenantFromHostname } from '@/lib/tenant';

describe('getTenantFromHostname', () => {
    it('resolves subdomains', () => {
        expect(getTenantFromHostname('prueba.localhost:3000')).toBe('prueba');
        expect(getTenantFromHostname('store.neutra.ec')).toBe('store');
    });

    it('ignores reserved subdomains', () => {
        expect(getTenantFromHostname('www.neutra.ec')).toBe('default');
        expect(getTenantFromHostname('api.neutra.ec')).toBe('default');
    });

    it('ignores IP hosts', () => {
        expect(getTenantFromHostname('192.168.1.1:3000')).toBe('default');
    });

    it('falls back by port in development', () => {
        expect(getTenantFromHostname('localhost:3001')).toBe('default');
        expect(getTenantFromHostname('localhost:3002')).toBe('booking1');
    });
});
