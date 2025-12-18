export const getTenantFromHostname = (hostname: string): string => {
    // Extract port and domain
    const port = hostname.split(':')[1];
    const domain = hostname.split(':')[0];

    // Port-based resolution for development
    if (domain === 'localhost' || domain === '127.0.0.1') {
        if (port === '3001') return 'default';
        if (port === '3002') return 'booking1';
        return process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default';
    }

    // Subdomain-based resolution
    const parts = domain.split('.');
    if (parts.length > 2) {
        const resolvedSlug = parts[0];
        if (resolvedSlug !== 'www' && resolvedSlug !== 'api') {
            return resolvedSlug;
        }
    }

    return 'default';
};
