import { cookies } from 'next/headers';
import { BookingNavbar } from '@/components/booking/booking-navbar';
import { Navigation as StoreNavbar } from '@/components/nav_bar';
import FooterWrapper from '@/components/footer-wrapper';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const moduleType = cookieStore.get('module-type')?.value;

    if (moduleType === 'booking') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <BookingNavbar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div id="root-content" className="min-h-screen flex flex-col">
            <StoreNavbar />
            <div className="pt-16 flex-1">
                {children}
            </div>
            <FooterWrapper />
        </div>
    );
}
