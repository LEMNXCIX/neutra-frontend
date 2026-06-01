import { BookingNavbar } from '@/components/booking/booking-navbar';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Book appointments and services",
};

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
            <BookingNavbar />
            <main className="flex-1 pt-16">
                {children}
            </main>
        </div>
    );
}
