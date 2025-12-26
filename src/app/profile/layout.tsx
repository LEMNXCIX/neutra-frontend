import { cookies } from 'next/headers';
import { BookingNavbar } from '@/components/booking/booking-navbar';
import { Navigation as StoreNavbar } from '@/components/nav_bar';
import FooterWrapper from '@/components/footer-wrapper';
import { NeutralNavigation } from '@/components/neutral-navigation';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const moduleType = cookieStore.get('module-type')?.value;

    if (moduleType === 'booking') {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <BookingNavbar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        );
    }

    const isNeutral = !moduleType || moduleType === 'root';

    return (
        <div id="root-content" className="min-h-screen flex flex-col">
            {isNeutral ? <NeutralNavigation /> : <StoreNavbar />}
            <div className="pt-16 flex-1 bg-white">
                {children}
            </div>
            <FooterWrapper minimal={isNeutral} />
        </div>
    );
}
