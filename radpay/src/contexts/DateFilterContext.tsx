import React, { createContext, useContext, useState } from "react";
import { startOfDay, endOfDay, subDays } from "date-fns";

export type DatePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface DateFilterContextType {
    period: DatePeriod;
    setPeriod: (period: DatePeriod) => void;
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
    apiDateRange: { startDate: string, endDate: string };
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const DateFilterProvider = ({ children }: { children: React.ReactNode }) => {
    const [period, setPeriod] = useState<DatePeriod>('today');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });

    const getApiDates = (): { startDate: string, endDate: string } => {
        const now = new Date();
        let start = now;
        let end = now;

        switch (period) {
            case 'today':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'yesterday':
                start = startOfDay(subDays(now, 1));
                end = endOfDay(subDays(now, 1));
                break;
            case 'week':
                // Last 7 days
                start = subDays(now, 7);
                end = now;
                break;
            case 'month':
                // Last 30 days
                start = subDays(now, 30);
                end = now;
                break;
            case 'custom':
                if (dateRange?.from) start = startOfDay(dateRange.from);
                if (dateRange?.to) end = endOfDay(dateRange.to);
                else end = endOfDay(start);
                break;
        }

        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    };

    const apiDateRange = getApiDates();

    return (
        <DateFilterContext.Provider value={{ period, setPeriod, dateRange, setDateRange, apiDateRange }}>
            {children}
        </DateFilterContext.Provider>
    );
};

export const useDateFilter = () => {
    const context = useContext(DateFilterContext);
    if (context === undefined) {
        throw new Error("useDateFilter must be used within a DateFilterProvider");
    }
    return context;
};
