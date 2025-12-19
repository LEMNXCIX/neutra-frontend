import React from 'react';
import ServicesTableClient from '@/components/admin/booking/ServicesTableClient';

export const dynamic = 'force-dynamic';

export default function AdminServicesPage() {
    return (
        <div className="p-6">
            <ServicesTableClient />
        </div>
    );
}
