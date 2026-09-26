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
