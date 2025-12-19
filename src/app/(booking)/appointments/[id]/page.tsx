'use client';

import { useEffect, useState, use } from 'react';
import { bookingService, Appointment } from '@/services/booking.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Calendar,
    Clock,
    User,
    FileText,
    AlertCircle,
    ArrowLeft,
    MapPin,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AppointmentDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getAppointmentById(id);
            setAppointment(data);
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
                    <p className="mt-4 text-muted-foreground">Loading appointment details...</p>
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Link href="/appointments" className="flex items-center gap-2 text-primary hover:underline mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Appointments
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Appointment not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                {/* Navigation */}
                <Link href="/appointments" className="flex items-center gap-2 text-primary hover:underline mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Appointments
                </Link>

                <div className="grid gap-8">
                    {/* Header Card */}
                    <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <div className="bg-primary h-2" />
                        <CardHeader className="pb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={getStatusVariant(appointment.status)} className="text-xs uppercase tracking-wider">
                                            {appointment.status.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">#{appointment.id.split('-')[0]}</span>
                                    </div>
                                    <CardTitle className="text-3xl font-bold tracking-tight">
                                        {appointment.service?.name || 'Service Appointment'}
                                    </CardTitle>
                                    <CardDescription className="text-lg">
                                        Professional session scheduled with our expert team
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8 border-t pt-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Time & Duration</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(appointment.startTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            <span className="text-muted-foreground font-normal ml-2 text-base">
                                                ({appointment.service?.duration || 30} mins)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Professional</p>
                                        <p className="text-lg font-semibold">{appointment.staff?.name || 'Assigned Staff'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Service Price</p>
                                        <p className="text-lg font-semibold">${appointment.service?.price || '0.00'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* More Info */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Appointment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium mb-1">Status Information</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {appointment.status === 'PENDING' && "Your appointment is pending confirmation. You'll receive an email once we've reviewed it."}
                                        {appointment.status === 'CONFIRMED' && "Great! Your appointment is confirmed and we're looking forward to seeing you."}
                                        {appointment.status === 'CANCELLED' && "This appointment has been cancelled."}
                                        {appointment.status === 'COMPLETED' && "This session has been completed. We hope you enjoyed your service!"}
                                    </p>
                                </div>
                                {appointment.notes && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Your Notes</p>
                                        <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg italic">
                                            "{appointment.notes}"
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Location/Action Card */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium mb-1 tracking-tight">Arrival Info</p>
                                    <p className="text-sm text-muted-foreground">
                                        Please arrive 5-10 minutes early to your appointment to ensure a smooth check-in process.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/contact">View Location Map</Link>
                                    </Button>
                                    {appointment.status === 'PENDING' && (
                                        <p className="text-[10px] text-center mt-2 text-muted-foreground italic">
                                            Need to reschedule? Please contact us directly.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
