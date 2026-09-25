import { normalizeWorkingHours, type WorkingHours } from "@/components/admin/booking/working-hours-utils";

/** Weekdays (0=Sun..6=Sat) the staff member works, from their workingHours. */
export function workingWeekdays(workingHours: unknown): Set<number> {
    const normalized: WorkingHours = normalizeWorkingHours(workingHours);
    const days = new Set<number>();
    const keys = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    keys.forEach((key, index) => {
        if (normalized[key]?.length) days.add(index);
    });
    return days;
}
