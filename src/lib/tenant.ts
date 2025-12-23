export const getTenantFromHostname = (hostname: string): string => {
    // Extract port and domain
    const port = hostname.split(':')[1];
    const domain = hostname.split(':')[0];
    const hostParts = domain.split('.');
    const isLocalhost = domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.localhost');
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
    const isNipIo = domain.endsWith('.nip.io');

    // Base parts: 1 for localhost/IP, 2 for domain.com, 6 for ip.nip.io
    const basePartsCount = isNipIo ? 6 : (domain.endsWith('.localhost') || (isLocalhost && hostParts.length > 1) ? 1 : 2);

    // 1. Subdomain-based resolution (e.g. tenant.localhost:3000 or tenant.com)
    if (!isIP && hostParts.length > basePartsCount) {
        const resolvedSlug = hostParts[0];
        if (resolvedSlug !== 'www' && resolvedSlug !== 'api' && resolvedSlug !== 'localhost' && !/^\d+$/.test(resolvedSlug)) {
            return resolvedSlug;
        }
    }

    // 2. Port-based resolution for development fallback
    if (isLocalhost) {
        if (port === '3001') return 'default';
        if (port === '3002') return 'booking1';
        return process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default';
    }

    return 'default';
};

export const getTenantUrl = (slug: string): string => {
    if (typeof window === 'undefined') return '/';

    const { hostname, port, protocol } = window.location;
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const portSuffix = port ? `:${port}` : '';

    if (isIP) {
        // Use nip.io for IP subdomains
        return `${protocol}//${slug}.${hostname}.nip.io${portSuffix}`;
    }

    // Default subdomain behavior (works for localhost and real domains)
    // We assume we are at the root domain (e.g., localhost or domain.com)
    return `${protocol}//${slug}.${hostname}${portSuffix}`;
};
