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
            <Card className="text-center py-12">
                <CardContent>
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No appointments yet</h3>
                    <p className="text-muted-foreground mb-6">Book your first service to see it here</p>
                    <Button asChild><Link href="/services">Browse Services</Link></Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6" /> Appointment History
            </h2>
            <div className="space-y-4">
                {initialAppointments.map((a) => (
                    <Card key={a.id} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{a.service?.name || 'Service'}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <UserIcon className="h-3 w-3" /> with {a.staff?.name || 'Staff'}
                                    </CardDescription>
                                </div>
                                <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(a.startTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t">
                                {a.status === 'PENDING' && (
                                    <CancelAppointmentDialog 
                                        appointmentId={a.id} 
                                        onAppointmentCancelled={() => router.refresh()}
                                        trigger={<Button variant="ghost" size="sm" className="text-destructive">Cancel</Button>}
                                    />
                                )}
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/appointments/${a.id}`}>Details</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
