export function isFutureSlot(date: string, time: string, now: Date): boolean {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const startsAt = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0,
    );

    return startsAt.getTime() > now.getTime();
}

export function filterFutureSlots(
    date: string,
    slots: readonly string[],
    now: Date,
): string[] {
    return slots.filter((time) => isFutureSlot(date, time, now));
}
