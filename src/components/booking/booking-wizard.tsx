'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Service, Staff, CreateAppointmentData, bookingService } from '@/services/booking.service';
import { couponsService } from '@/services/coupons.service';
import { CouponValidationResult } from '@/types/coupon.types';
import { useAuthStore } from '@/store/auth-store';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Clock, User, ChevronLeft, Check, AlertCircle, Info, Tag } from 'lucide-react';

interface BookingWizardProps {
    initialServices: Service[];
    initialStaff: Staff[];
    preSelectedServiceId?: string | null;
}

export function BookingWizard({ initialServices, initialStaff, preSelectedServiceId }: BookingWizardProps) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { isFeatureEnabled } = useFeatures();

    // Step state
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(
        initialServices.find(s => s.id === preSelectedServiceId) || null
    );
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    
    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Auto-advance to step 2 if service is pre-selected
    useEffect(() => {
        if (preSelectedServiceId && selectedService && step === 1) {
            setStep(2);
        }
    }, [preSelectedServiceId, selectedService]);

    // Check availability when date or staff changes
    useEffect(() => {
        if (selectedDate && selectedStaff && selectedService && step === 3) {
            checkAvailability();
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDate, selectedStaff, selectedService, step]);

    const checkAvailability = async () => {
        if (!selectedStaff || !selectedDate || !selectedService) return;
        try {
            setLoadingAvailability(true);
            const slots = await bookingService.checkAvailability(
                selectedStaff.id,
                selectedService.id,
                selectedDate
            );
            setAvailableSlots(slots);
        } catch (err) {
            console.error('Failed to check availability', err);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const validateCoupon = async () => {
        if (!couponCode.trim() || !selectedService) return;
        try {
            setValidatingCoupon(true);
            setCouponError(null);
            const result = await couponsService.validate(
                couponCode,
                selectedService.price,
                undefined,
                undefined,
                [selectedService.id]
            );
            if (result.valid) {
                setCouponResult(result);
            } else {
                setCouponError(result.message || 'Invalid coupon code');
                setCouponResult(null);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Failed to validate coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
            setError('Please complete all required fields');
            return;
        }
        if (!user) {
            router.push(`/login?redirect=/book`);
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
                couponCode: couponResult?.valid ? couponResult.coupon?.code : undefined
            };
            await bookingService.createAppointment(appointmentData);
            router.push('/appointments?success=true');
        } catch (err: any) {
            setError(err.message || 'Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break;
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
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

    return (
        <div className="space-y-8">
            {/* Progress Steps */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        {steps.map((s, index) => (
                            <div key={s.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg transition-all ${
                                        step === s.number ? 'bg-primary text-primary-foreground shadow-lg scale-110' :
                                        step > s.number ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {step > s.number ? <Check className="h-6 w-6" /> : s.icon}
                                    </div>
                                    <span className={`mt-2 text-sm font-medium ${step === s.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <Separator className={`flex-1 mx-2 ${step > s.number ? 'bg-green-500' : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Step 1: Select Service */}
            {step === 1 && (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Select a Service</h2>
                        <p className="text-muted-foreground">Choose the service you would like to book</p>
                    </div>
                    {initialServices.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                            <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No services available at the moment.</p>
                        </div>
                    ) : (
                        /* Grouping logic */
                        Object.entries(initialServices.reduce((acc, s) => {
                            const cat = s.category?.name || 'Uncategorized';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(s);
                            return acc;
                        }, {} as Record<string, Service[]>)).map(([cat, svcs]) => (
                            <div key={cat} className="space-y-4">
                                <h3 className="text-lg font-medium px-1 border-l-4 border-primary">{cat}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {svcs.map(s => (
                                        <Card 
                                            key={s.id} 
                                            className={`cursor-pointer transition-all hover:shadow-lg ${selectedService?.id === s.id ? 'border-primary ring-1 ring-primary/20' : ''}`}
                                            onClick={() => { setSelectedService(s); setStep(2); }}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <Badge variant="outline" className="text-primary border-primary/20">${s.price}</Badge>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" /> {s.duration} min
                                                    </div>
                                                </div>
                                                <CardTitle>{s.name}</CardTitle>
                                                {s.description && <CardDescription className="line-clamp-2">{s.description}</CardDescription>}
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Step 2: Select Staff */}
            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Choose Staff Member</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {initialStaff.filter(m => !m.serviceIds || !selectedService || m.serviceIds.includes(selectedService.id)).map(member => (
                            <Card 
                                key={member.id} 
                                className={`cursor-pointer transition-all hover:shadow-lg ${selectedStaff?.id === member.id ? 'border-primary' : ''}`}
                                onClick={() => { setSelectedStaff(member); setStep(3); }}
                            >
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{member.name}</CardTitle>
                                            {member.bio && <CardDescription className="mt-1 line-clamp-1">{member.bio}</CardDescription>}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-4">Pick Date & Time</h2>
                    <Card>
                        <CardHeader><CardTitle>Select Date</CardTitle></CardHeader>
                        <CardContent>
                            <Input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)} 
                                min={new Date().toISOString().split('T')[0]} 
                            />
                        </CardContent>
                    </Card>
                    {selectedDate && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Time</CardTitle>
                                <CardDescription>{loadingAvailability ? "Checking availability..." : "Available slots"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-2">
                                    {generateTimeSlots().map(time => {
                                        const isAvail = availableSlots.includes(time);
                                        return isAvail ? (
                                            <Button 
                                                key={time} 
                                                variant={selectedTime === time ? 'default' : 'outline'}
                                                onClick={() => setSelectedTime(time)}
                                            >{time}</Button>
                                        ) : null;
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-2" /> Back</Button>
                        {selectedDate && selectedTime && <Button onClick={() => setStep(4)}>Continue</Button>}
                    </div>
                </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-4">Confirm Appointment</h2>
                    <Card>
                        <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Service</p><p className="font-semibold">{selectedService?.name}</p></div>
                                <div><p className="text-muted-foreground">Staff</p><p className="font-semibold">{selectedStaff?.name}</p></div>
                                <div><p className="text-muted-foreground">Date</p><p className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</p></div>
                                <div><p className="text-muted-foreground">Time</p><p className="font-semibold">{selectedTime}</p></div>
                            </div>
                            
                            <Separator />
                            
                            {isFeatureEnabled('COUPONS') && (
                                <div className="pt-2">
                                    <Label className="mb-2 block">Have a Coupon?</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="CODE" 
                                            value={couponCode} 
                                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            disabled={!!couponResult}
                                        />
                                        <Button variant="outline" onClick={validateCoupon} disabled={!couponCode || validatingCoupon}>
                                            {validatingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : couponResult ? "Applied" : "Apply"}
                                        </Button>
                                    </div>
                                    {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                                </div>
                            )}

                            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm"><span>Subtotal</span><span>${selectedService?.price}</span></div>
                                {couponResult?.discountAmount && (
                                    <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-${couponResult.discountAmount}</span></div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Total</span>
                                    <span>${Math.max(0, (selectedService?.price || 0) - (couponResult?.discountAmount || 0))}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special requests..." />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setStep(3)} disabled={submitting}><ChevronLeft className="h-4 w-4 mr-2" /> Back</Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                            Confirm Booking
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
