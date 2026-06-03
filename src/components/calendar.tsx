import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/queries";
import { useUI } from "@/lib/ui-store";
import { readUI, usePreferences } from "@/lib/preferences";
import { cn, isSameDay } from "@/lib/utils";

export function CalendarView() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const prefs = usePreferences();
  const ui = readUI(prefs.data);
  const weekStart = ui.weekStartsOn ?? 1;

  const tasks = useTasks({});
  const openTask = useUI((s) => s.openTask);

  const days = useMemo(() => buildMonthGrid(cursor, weekStart), [cursor, weekStart]);

  const dayLabels = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [...labels.slice(weekStart), ...labels.slice(0, weekStart)];
  }, [weekStart]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date();
            d.setDate(1);
            setCursor(d);
          }}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
          {dayLabels.map((l) => (
            <div key={l} className="px-2 py-1.5 text-center">
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayTasks = (tasks.data ?? []).filter(
              (t) => t.due && isSameDay(new Date(t.due), d.date),
            );
            const isToday = isSameDay(d.date, new Date());
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[96px] border-b border-r border-border p-1.5 text-xs",
                  !d.inMonth && "bg-muted/20 text-muted-foreground",
                  isToday && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {d.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openTask(t.id)}
                      className={cn(
                        "block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px]",
                        t.done
                          ? "bg-muted text-muted-foreground line-through"
                          : "bg-primary/15 text-foreground hover:bg-primary/25",
                      )}
                    >
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildMonthGrid(monthStart: Date, weekStart: number) {
  const first = new Date(monthStart);
  first.setDate(1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === monthStart.getMonth() });
  }
  return cells;
}
