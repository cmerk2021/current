import { useMemo } from "react";
import { useTasks } from "@/lib/queries";
import { TaskList } from "@/components/tasks/task-list";
import { LoadingScreen } from "@/components/loading-screen";
import type { TaskRecord } from "@/lib/pb";

export function UpcomingPage() {
  const upcoming = useTasks({ due: "upcoming", done: false });

  const grouped = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const t of upcoming.data ?? []) {
      if (!t.due) continue;
      const key = new Date(t.due).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [upcoming.data]);

  if (upcoming.isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Upcoming</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything with a future due date.</p>
      </header>

      {grouped.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          You're all clear. Nothing scheduled.
        </div>
      ) : (
        grouped.map(([date, tasks]) => (
          <section key={date} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {date}
            </h2>
            <TaskList tasks={tasks} />
          </section>
        ))
      )}
    </div>
  );
}
