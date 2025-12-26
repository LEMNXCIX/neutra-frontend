'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { bookingService, Appointment } from '@/services/booking.service';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Clock, User, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment-dialog';

export default function AppointmentsPage() {
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const user = useAuthStore((state) => state.user);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadAppointments();
        } else if (!useAuthStore.getState().loading) {
            setLoading(false);
        }
    }, [user]);

    const loadAppointments = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await bookingService.getAppointments({ userId: user.id });
            setAppointments(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: 'outline',
            CONFIRMED: 'default',
            IN_PROGRESS: 'secondary',
            COMPLETED: 'secondary',
            CANCELLED: 'destructive',
            NO_SHOW: 'outline',
        };
        return variants[status] || 'outline';
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                        My <span className="text-primary">Appointments</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your upcoming and past appointments
                    </p>
                </div>

                {/* Success Alert */}
                {success && (
                    <Alert className="mb-6 border-green-500/50 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Appointment booked successfully! You'll receive a confirmation email shortly.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Appointments List */}
                {appointments.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent className="pt-6 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-lg font-medium mb-2">No appointments yet</p>
                                <p className="text-muted-foreground mb-6">
                                    Book your first appointment to get started
                                </p>
                            </div>
                            <Button asChild size="lg">
                                <Link href="/services">Browse Services</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment) => (
                            <Card
                                key={appointment.id}
                                className="hover:shadow-lg transition-all duration-300"
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Link
                                            href={`/appointments/${appointment.id}`}
                                            className="space-y-1 group flex-1"
                                        >
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                {appointment.service?.name || 'Service'}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 group-hover:text-foreground transition-colors">
                                                <User className="h-4 w-4" />
                                                with {appointment.staff?.name || 'Staff Member'}
                                            </CardDescription>
                                        </Link>
                                        <Badge variant={getStatusVariant(appointment.status)}>
                                            {appointment.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Date</p>
                                                <p className="font-medium">
                                                    {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Time</p>
                                                <p className="font-medium">
                                                    {new Date(appointment.startTime).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {appointment.notes && (
                                        <div className="flex items-start gap-2 text-sm mt-4 p-3 bg-muted/50 rounded-lg">
                                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                                <p className="text-sm">{appointment.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.status === 'PENDING' && (
                                        <div className="mt-4 pt-4 border-t">
                                            <CancelAppointmentDialog
                                                appointmentId={appointment.id}
                                                onAppointmentCancelled={loadAppointments}
                                                trigger={
                                                    <Button variant="destructive" size="sm">
                                                        Cancel Appointment
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
