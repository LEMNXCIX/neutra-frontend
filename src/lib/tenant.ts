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
    const portSuffix = port ? `:${port}` : '';

    // Handle raw IP addresses -> redirect to nip.io
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIP) {
        return `${protocol}//${slug}.${hostname}.nip.io${portSuffix}`;
    }

    const parts = hostname.split('.');

    // Check for nip.io domains
    const isNipIo = hostname.endsWith('.nip.io');

    // Check for localhost domains
    const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');

    // Determine the base domain parts count
    // localhost = 1 part (e.g., localhost)
    // domain.com = 2 parts
    // user.nip.io = 6 parts (e.g., 1.2.3.4.nip.io)
    // sub.localhost -> 2 parts -> base 1
    // sub.domain.com -> 3 parts -> base 2
    let basePartsCount = 2; // Default for standard domains (example.com)

    if (isLocalhost) {
        basePartsCount = 1;
    } else if (isNipIo) {
        basePartsCount = 6;
    }

    // If we have more parts than the base domain, we have a subdomain
    if (parts.length > basePartsCount) {
        // Replace the existing subdomain (first part)
        parts[0] = slug;
        return `${protocol}//${parts.join('.')}${portSuffix}`;
    }

    // No subdomain active, prepend the slug
    return `${protocol}//${slug}.${hostname}${portSuffix}`;
};
