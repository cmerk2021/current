import { CalendarView } from "@/components/calendar";

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your tasks laid out by due date.</p>
      </header>
      <CalendarView />
    </div>
  );
}
