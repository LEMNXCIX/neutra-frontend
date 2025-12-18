import { BookingNavbar } from '@/components/booking/booking-navbar';

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <BookingNavbar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
