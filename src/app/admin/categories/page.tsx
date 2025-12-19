import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminCategoriesRedirect() {
    const cookieStore = await cookies();
    const isBooking = cookieStore.get('tenant-type')?.value === 'BOOKING';

    if (isBooking) {
        redirect('/booking-admin/categories');
    } else {
        redirect('/store-admin/categories');
    }
}
