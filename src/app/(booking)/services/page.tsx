'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingService, Service } from '@/services/booking.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Loader2 } from 'lucide-react';

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getServices();
            setServices(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load services');
            console.error('Error loading services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBookService = (service: Service) => {
        router.push(`/book?serviceId=${service.id}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading services...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error Loading Services</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={loadServices} variant="outline">
                            Try Again
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <Badge variant="outline" className="mb-4">Professional Services</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Our <span className="text-primary">Services</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose from our range of professional services tailored to your needs
                    </p>
                </div>

                {/* Services Grid grouped by Category */}
                {services.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground text-lg">No services available at the moment.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(services.reduce((acc, service) => {
                            const categoryName = service.category?.name || 'Uncategorized';
                            if (!acc[categoryName]) acc[categoryName] = [];
                            acc[categoryName].push(service);
                            return acc;
                        }, {} as Record<string, Service[]>)).map(([categoryName, categoryServices]) => (
                            <div key={categoryName} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold px-3 border-l-4 border-primary bg-muted/30 py-1 rounded-r-md">
                                        {categoryName}
                                    </h2>
                                    <Badge variant="secondary" className="font-normal">
                                        {categoryServices.length} {categoryServices.length === 1 ? 'Service' : 'Services'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categoryServices.map((service) => (
                                        <Card
                                            key={service.id}
                                            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <Badge variant="secondary" className="capitalize">{service.category?.name || 'Service'}</Badge>
                                                    <Badge variant="outline" className="bg-background">
                                                        {service.active ? 'Available' : 'Unavailable'}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-2xl">{service.name}</CardTitle>
                                                <CardDescription className="text-base">
                                                    {service.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{service.duration} min</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-5 w-5 text-primary" />
                                                        <span className="text-2xl font-bold">{service.price}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    onClick={() => handleBookService(service)}
                                                    className="w-full"
                                                    size="lg"
                                                >
                                                    Book Now
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
