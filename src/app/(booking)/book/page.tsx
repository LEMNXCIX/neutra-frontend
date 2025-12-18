'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { bookingService, Service, Staff, CreateAppointmentData } from '@/services/booking.service';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Clock, DollarSign, User, Calendar as CalendarIcon, ChevronLeft, Check, AlertCircle } from 'lucide-react';

export default function BookPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedServiceId = searchParams.get('serviceId');
    const user = useAuthStore((state) => state.user);

    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    // Wizard state
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Availability state
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Check availability when date or staff changes
    useEffect(() => {
        if (selectedDate && selectedStaff && selectedService) {
            checkAvailability();
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDate, selectedStaff, selectedService, step]);

    const checkAvailability = async () => {
        if (!selectedStaff || !selectedDate || !selectedService) return;

        try {
            setLoadingAvailability(true);

            // Call the new API endpoint
            const availableSlots = await bookingService.checkAvailability(
                selectedStaff.id,
                selectedService.id,
                selectedDate
            );

            // The API returns AVAILABLE slots.
            // But our UI logic currently 'disables' slots that are in 'bookedSlots'.
            // So we need to invert the logic or update the UI logic.
            // Let's update the UI logic to show only available slots, or mark as unavailable those NOT in the list.

            // Current UI: 
            // {generateTimeSlots().map((time) => {
            //      const isTaken = bookedSlots.includes(time);

            // If we switch to 'allowedSlots', then:
            // const isAllowed = allowedSlots.includes(time);
            // disabled={!isAllowed}

            // So let's store 'allowedSlots' instead of 'bookedSlots'.
            setAvailableSlots(availableSlots);

        } catch (err) {
            console.error('Failed to check availability', err);
        } finally {
            setLoadingAvailability(false);
        }
    };

    useEffect(() => {
        if (preSelectedServiceId && services.length > 0) {
            const service = services.find(s => s.id === preSelectedServiceId);
            if (service) {
                setSelectedService(service);
                setStep(2);
            }
        }
    }, [preSelectedServiceId, services]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [servicesData, staffData] = await Promise.all([
                bookingService.getServices(),
                bookingService.getStaff(),
            ]);
            setServices(servicesData);
            setStaff(staffData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
            setError('Please complete all required fields');
            return;
        }

        if (!user) {
            setError('You must be logged in to book an appointment');
            router.push('/login?redirect=/book');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const startTime = new Date(`${selectedDate}T${selectedTime}`);

            const appointmentData: CreateAppointmentData = {
                userId: user.id,
                serviceId: selectedService.id,
                staffId: selectedStaff.id,
                startTime: startTime.toISOString(),
                notes,
            };

            await bookingService.createAppointment(appointmentData);

            // Success! Redirect to appointments
            router.push('/appointments?success=true');
        } catch (err: any) {
            setError(err.message || 'Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    // Generate time slots (9 AM - 5 PM, 30-min intervals)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    };

    const steps = [
        { number: 1, label: 'Service', icon: '🛎️' },
        { number: 2, label: 'Staff', icon: '👤' },
        { number: 3, label: 'Date & Time', icon: '📅' },
        { number: 4, label: 'Confirm', icon: '✓' },
    ];

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading booking wizard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                        Book an <span className="text-primary">Appointment</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Complete the steps below to schedule your appointment
                    </p>
                </div>

                {/* Progress Steps */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            {steps.map((s, index) => {
                                const isActive = step === s.number;
                                const isCompleted = step > s.number;

                                return (
                                    <div key={s.number} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg transition-all ${isActive
                                                ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                                                : isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {isCompleted ? <Check className="h-6 w-6" /> : s.icon}
                                            </div>
                                            <span className={`mt-2 text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <Separator className={`flex-1 mx-2 ${step > s.number ? 'bg-green-500' : ''}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Step 1: Select Service */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold mb-4">Select a Service</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service) => (
                                <Card
                                    key={service.id}
                                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedService?.id === service.id
                                        ? 'border-primary shadow-md'
                                        : ''
                                        }`}
                                    onClick={() => {
                                        setSelectedService(service);
                                        setStep(2);
                                    }}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge variant="secondary">{service.category}</Badge>
                                            <Badge variant="outline" className="bg-background">
                                                ${service.price}
                                            </Badge>
                                        </div>
                                        <CardTitle>{service.name}</CardTitle>
                                        <CardDescription>{service.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{service.duration} minutes</span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Staff */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold mb-4">Choose Staff Member</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {staff.filter(member =>
                                !member.serviceIds || // If no services defined, maybe assume all? Or strictly check. Let's check strict if array exists.
                                (member.serviceIds && selectedService && member.serviceIds.includes(selectedService.id))
                            ).length === 0 ? (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    <p>No staff members available for this service.</p>
                                </div>
                            ) : (
                                staff.filter(member =>
                                    // If serviceIds is missing (legacy data), show them. If present, must match.
                                    !member.serviceIds ||
                                    (member.serviceIds.length === 0) || // If empty array, maybe they do nothing? Or everything? Let's assume strict join table means only listed. 
                                    (selectedService && member.serviceIds.includes(selectedService.id))
                                ).map((member) => (
                                    <Card
                                        key={member.id}
                                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedStaff?.id === member.id
                                            ? 'border-primary shadow-md'
                                            : ''
                                            }`}
                                        onClick={() => {
                                            setSelectedStaff(member);
                                            setStep(3);
                                        }}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{member.name}</CardTitle>
                                                    {member.bio && <CardDescription className="mt-1">{member.bio}</CardDescription>}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                )))}
                        </div>
                        <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                )}

                {/* Step 3: Select Date & Time */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-4">Pick Date & Time</h2>

                        <Card>
                            <CardHeader>
                                <CardTitle>Select Date</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full"
                                />
                            </CardContent>
                        </Card>

                        {selectedDate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Time</CardTitle>
                                    <CardDescription>
                                        {loadingAvailability
                                            ? <span className="flex items-center text-primary"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Checking availability...</span>
                                            : "Available slots (30-minute intervals)"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-2">
                                        {generateTimeSlots().map((time) => {
                                            const isAvailable = availableSlots.includes(time);
                                            return (
                                                <Button
                                                    key={time}
                                                    onClick={() => isAvailable && setSelectedTime(time)}
                                                    variant={selectedTime === time ? 'default' : !isAvailable ? 'ghost' : 'outline'}
                                                    disabled={!isAvailable}
                                                    size="sm"
                                                    className={!isAvailable ? 'opacity-50 cursor-not-allowed bg-muted line-through decoration-destructive' : ''}
                                                >
                                                    {time}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(2)}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            {selectedDate && selectedTime && (
                                <Button onClick={() => setStep(4)}>
                                    Continue
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-4">Confirm Appointment</h2>

                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service</p>
                                        <p className="font-semibold">{selectedService?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Staff</p>
                                        <p className="font-semibold">{selectedStaff?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-semibold">
                                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-semibold">{selectedTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-semibold">{selectedService?.duration} minutes</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Price</p>
                                        <p className="font-semibold text-2xl text-primary">${selectedService?.price}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Notes (Optional)
                                    </label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Any special requests or information..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(3)} disabled={submitting}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                size="lg"
                                className="flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Confirm Booking
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
