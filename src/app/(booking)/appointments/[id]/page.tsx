import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { getBackendUrl } from '@/lib/backend-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
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
import { AppointmentDetailActions } from '@/components/booking/appointment-detail-actions';

export const dynamic = 'force-dynamic';

async function getAppointmentData(id: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const tenantSlug = cookieStore.get('tenant-slug')?.value || '';

        if (!token) return { error: 'unauthorized' };

        // Validate user session
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return { error: 'unauthorized' };

        const baseUrl = getBackendUrl();
        const response = await fetch(`${baseUrl}/appointments/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`,
                'x-tenant-slug': tenantSlug
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            if (response.status === 404) return { error: 'not_found' };
            return { error: 'fetch_failed' };
        }

        const result = await response.json();
        const appointment = result.data;

        // Permission check
        if (appointment && appointment.userId !== user.id && user.role?.name !== 'ADMIN' && user.role?.name !== 'SUPER_ADMIN') {
            return { error: 'forbidden' };
        }

        return { appointment, user };
    } catch (error) {
        console.error('Error fetching appointment detail on server:', error);
        return { error: 'internal_error' };
    }
}

export default async function AppointmentDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const { appointment, user, error } = await getAppointmentData(id);

    if (error === 'unauthorized') redirect('/login');
    if (error === 'not_found') notFound();

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
                        {error === 'forbidden' ? 'You do not have permission to view this appointment' : 'Failed to load appointment details'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
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
                                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
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

                                <AppointmentDetailActions 
                                    appointmentId={appointment.id}
                                    status={appointment.status}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
