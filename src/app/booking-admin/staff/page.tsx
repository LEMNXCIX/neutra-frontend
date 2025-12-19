import React from 'react';
import StaffTableClient from '@/components/admin/booking/StaffTableClient';

export const dynamic = 'force-dynamic';

export default function AdminStaffPage() {
    return (
        <div className="p-6">
            <StaffTableClient />
        </div>
    );
}
