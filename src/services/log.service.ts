import { api } from "@/lib/api-client";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    tenantId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    message: string;
    metadata?: any;
    error?: any;
    traceId?: string;
}

export interface LogFilters {
    level?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
}

export const logService = {
    getAll: async (filters: LogFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, value.toString());
            }
        });

        const response = await api.get<{
            data: LogEntry[],
            pagination: { total: number, skip: number, take: number }
        }>(`/admin/logs?${params.toString()}`);
        return response;
    },

    getStats: async (timeframe: string = 'daily') => {
        const response = await api.get<any>(`/admin/logs/stats?timeframe=${timeframe}`);
        return response;
    }
};
