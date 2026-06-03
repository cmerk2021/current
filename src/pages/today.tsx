import { useMemo } from "react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function TodayPage() {
  // "Today" = anything due today-or-earlier OR explicitly scheduled for today.
  // New tasks from this view get scheduled=today so they show up here without
  // inheriting a fake due date.
  const today = useTasks({ todayView: true, done: false });
  const overdue = useTasks({ due: "overdue" });
  const completed = useTasks({ done: true });

  const completedToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return (completed.data ?? []).filter(
      (t) => t.completed_at && new Date(t.completed_at) >= start,
    );
  }, [completed.data]);

  // Overdue tasks are a subset of `todayView`; split them visually.
  const overdueIds = useMemo(
    () => new Set((overdue.data ?? []).map((t) => t.id)),
    [overdue.data],
  );
  const todayBucket = (today.data ?? []).filter((t) => !overdueIds.has(t.id));

  if (today.isLoading) return <LoadingScreen />;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const scheduledNow = new Date();
  scheduledNow.setHours(12, 0, 0, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today</h1>
      </header>

      <QuickAdd
        defaults={{ scheduled: scheduledNow.toISOString() }}
        placeholder="What's on for today?"
      />

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
          Today
        </h2>
        <TaskList tasks={todayBucket} />
      </section>

      {completedToday.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed today
          </h2>
          <TaskList tasks={completedToday} />
        </section>
      )}
    </div>
  );
}
