import { useMemo } from "react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function TodayPage() {
  const today = useTasks({ due: "today", done: false });
  const overdue = useTasks({ due: "overdue" });
  const completedToday = useTasks({ done: true });

  const completedFiltered = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return (completedToday.data ?? []).filter(
      (t) => t.completed_at && new Date(t.completed_at) >= start,
    );
  }, [completedToday.data]);

  if (today.isLoading) return <LoadingScreen />;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today</h1>
      </header>

      <QuickAdd defaults={{ due: new Date().toISOString() }} placeholder="What's on for today?" />

      {overdue.data && overdue.data.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Overdue
          </h2>
          <TaskList tasks={overdue.data} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Due today
        </h2>
        <TaskList tasks={today.data ?? []} />
      </section>

      {completedFiltered.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed today
          </h2>
          <TaskList tasks={completedFiltered} />
        </section>
      )}
    </div>
  );
}
