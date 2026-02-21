'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/services/booking.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign } from 'lucide-react';

interface ServicesGridProps {
    services: Service[];
}

export function ServicesGrid({ services }: ServicesGridProps) {
    const router = useRouter();

    const handleBookService = (serviceId: string) => {
        router.push(`/book?serviceId=${serviceId}`);
    };

    if (!services || services.length === 0) {
        return (
            <Card className="text-center py-12">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-lg">No services available at the moment.</p>
                </CardContent>
            </Card>
        );
    }

    // Group services by category
    const groupedServices = services.reduce((acc, service) => {
        const categoryName = service.category?.name || 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    return (
        <div className="space-y-12">
            {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
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
                                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
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
                                <CardContent className="flex-1">
                                    <div className="flex items-center justify-between text-sm mt-auto">
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
                                        onClick={() => handleBookService(service.id)}
                                        className="w-full"
                                        size="lg"
                                        disabled={!service.active}
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
    );
}
