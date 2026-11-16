const TIME_ZONE = "America/Sao_Paulo";

export function inclusiveCalendarDays(startDate: string, endDate: string) {
  const end = new Date(`${endDate}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: { date: startDate }, end: { date: end.toISOString().slice(0, 10) } };
}

// Availability spans are all-day events; the exact deadline stays in the description.
export function taskCalendarPeriod(startDate: string | null, dueDate: string, dueTime: string | null) {
  if (startDate && startDate <= dueDate) return inclusiveCalendarDays(startDate, dueDate);
  if (!dueTime) return inclusiveCalendarDays(dueDate, dueDate);
  const end = new Date(`${dueDate}T${dueTime}:00Z`);
  end.setUTCMinutes(end.getUTCMinutes() + 60);
  return {
    start: { dateTime: `${dueDate}T${dueTime}:00`, timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString().slice(0, 19), timeZone: TIME_ZONE },
  };
}

export function classroomTaskStart(item: { scheduledTime?: string; creationTime?: string }, dueDate: string) {
  const value = item.scheduledTime ?? item.creationTime;
  const timestamp = value ? new Date(value) : null;
  if (!timestamp || Number.isNaN(timestamp.getTime())) return { startDate: null, startDateSource: null };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(timestamp);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  if (date > dueDate) return { startDate: null, startDateSource: null };
  return {
    startDate: new Date(`${date}T12:00:00Z`),
    startDateSource: item.scheduledTime ? "SCHEDULED" : "CREATED",
  };
}
