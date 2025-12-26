import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Extract tenant name from host or use default
    // This logic should match your subdomain/slug resolution
    let tenantName = 'XCIX';
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
        tenantName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    return {
        id: '/',
        name: `${tenantName} Platform`,
        short_name: tenantName,
        description: `Mobile app for ${tenantName}`,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    };
}
