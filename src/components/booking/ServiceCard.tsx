'use client';

import { Service } from '@/services/booking.service';

interface ServiceCardProps {
    service: Service;
    onBook?: (service: Service) => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    {service.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {service.category}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${service.price}</p>
                </div>
            </div>

            {service.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.duration} min
                </div>

                <button
                    onClick={() => onBook?.(service)}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}
