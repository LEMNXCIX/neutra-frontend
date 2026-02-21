'use client';

import React from 'react';
import { Appointment } from '@/services/booking.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User as UserIcon, MapPin, Eye } from 'lucide-react';
import Link from 'next/link';
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment-dialog';
import { useRouter } from 'next/navigation';

interface AppointmentHistoryProps {
    initialAppointments: Appointment[];
}

export function AppointmentHistory({ initialAppointments }: AppointmentHistoryProps) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "CONFIRMED": return "bg-green-500 text-white";
            case "IN_PROGRESS": return "bg-blue-500 text-white";
            case "PENDING": return "bg-yellow-500 text-white";
            case "CANCELLED": return "bg-red-500 text-white";
            case "COMPLETED": return "bg-purple-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    if (initialAppointments.length === 0) {
        return (
            <Card className="text-center py-20 border-none shadow-xl rounded-[2rem] bg-muted/20">
                <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Calendar className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight">No appointments yet</h3>
                        <p className="text-muted-foreground font-medium">Your scheduled services will appear here once you make a booking.</p>
                    </div>
                    <Button asChild size="lg" className="rounded-xl px-8 font-bold"><Link href="/services">Browse Services</Link></Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" /> Scheduled Services
            </h2>
            <div className="space-y-6">
                {initialAppointments.map((a) => (
                    <Card key={a.id} className="overflow-hidden border-none shadow-lg rounded-[2rem] bg-background group hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-sm">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold tracking-tight">{a.service?.name || 'Service'}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1 font-medium">
                                            <UserIcon className="h-3 w-3 text-primary" /> with {a.staff?.name || 'Staff'}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getStatusColor(a.status)} rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm`}>{a.status}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-medium">
                                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</p>
                                        <p className="text-base font-bold">{new Date(a.startTime).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time</p>
                                        <p className="text-base font-bold">{new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                                {a.status === 'PENDING' && (
                                    <CancelAppointmentDialog 
                                        appointmentId={a.id} 
                                        onAppointmentCancelled={() => router.refresh()}
                                        trigger={<Button variant="ghost" size="lg" className="rounded-xl font-bold text-destructive hover:bg-destructive/5 px-8">Cancel Appointment</Button>}
                                    />
                                )}
                                <Button variant="secondary" size="lg" className="rounded-xl font-bold px-8 h-12" asChild>
                                    <Link href={`/appointments/${a.id}`} className="flex items-center gap-2"><Eye className="h-4 w-4" /> View Details</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
