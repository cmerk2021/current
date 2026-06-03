import { useMemo } from "react";
import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function DashboardPage() {
  const all = useTasks({});
  const today = useTasks({ due: "today" });
  const overdue = useTasks({ due: "overdue" });

  const stats = useMemo(() => {
    const items = all.data ?? [];
    const done = items.filter((t) => t.done).length;
    const total = items.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [all.data]);

  if (all.isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">A quick read on where you stand.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListTodo} label="Open tasks" value={stats.total - stats.done} />
        <StatCard icon={Clock} label="Due today" value={today.data?.length ?? 0} />
        <StatCard
          icon={TrendingUp}
          label="Overdue"
          value={overdue.data?.length ?? 0}
          tone={overdue.data?.length ? "warning" : "default"}
        />
        <StatCard icon={CheckCircle2} label="Completion" value={`${stats.pct}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.done} of {stats.total} tasks completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span
          className={
            tone === "warning"
              ? "grid h-9 w-9 place-items-center rounded-lg bg-destructive/15 text-destructive"
              : "grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"
          }
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
