import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, EyeOff, GripVertical, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProjects, useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";
import { readWidgets, usePreferences, useUpdateWidgets } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import type { Priority, TaskRecord } from "@/lib/pb";
import { cn } from "@/lib/utils";

interface WidgetDef {
  id: string;
  title: string;
  render: () => JSX.Element;
}

export function DashboardPage() {
  const prefs = usePreferences();
  const all = useTasks({});
  const today = useTasks({ due: "today", done: false });
  const overdue = useTasks({ due: "overdue" });
  const upcoming = useTasks({ due: "upcoming", done: false });
  const projects = useProjects();
  const update = useUpdateWidgets();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");

  const stats = useMemo(() => {
    const items = all.data ?? [];
    const done = items.filter((t) => t.done).length;
    const total = items.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [all.data]);

  const layout = readWidgets(prefs.data).layout;
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);

  if (all.isLoading) return <LoadingScreen />;

  const widgets: WidgetDef[] = [
    {
      id: "today",
      title: "Due today",
      render: () => <StatCard icon={Clock} label="Due today" value={today.data?.length ?? 0} />,
    },
    {
      id: "overdue",
      title: "Overdue",
      render: () => (
        <StatCard
          icon={TrendingUp}
          label="Overdue"
          value={overdue.data?.length ?? 0}
          tone={overdue.data?.length ? "warning" : "default"}
        />
      ),
    },
    {
      id: "progress",
      title: "Progress",
      render: () => (
        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-sm">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <StatCard icon={CheckCircle2} label="Done" value={`${stats.pct}%`} compact />
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats.done} of {stats.total} tasks completed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "upcoming",
      title: "Upcoming",
      render: () => <UpcomingWidget tasks={upcoming.data ?? []} />,
    },
    {
      id: "priority",
      title: "By priority",
      render: () => <PriorityWidget tasks={all.data ?? []} />,
    },
    {
      id: "projects",
      title: "Projects",
      render: () => <ProjectsWidget projects={projects.data ?? []} tasks={all.data ?? []} />,
    },
    {
      id: "streak",
      title: "Streak",
      render: () => <StreakWidget tasks={all.data ?? []} />,
    },
  ];

  const sorted = [...layout].sort((a, b) => a.order - b.order);
  const visibleIds = new Set(sorted.filter((w) => w.visible).map((w) => w.id));

  function setVisible(id: string, vis: boolean) {
    const next = layout.map((w) => (w.id === id ? { ...w, visible: vis } : w));
    update({ layout: next });
  }

  function reorder(targetId: string) {
    if (!drag || drag === targetId) return;
    const ids = sorted.map((w) => w.id);
    const from = ids.indexOf(drag);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, drag);
    const next = ids.map((id, i) => {
      const w = layout.find((x) => x.id === id);
      return { id, visible: w?.visible ?? true, order: i };
    });
    // include any widgets that weren't in `ids` (shouldn't happen, but safe)
    update({ layout: next });
    setDrag(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">A quick read on where you stand.</p>
        </div>
        {features.widgets && (
          <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)}>
            {editing ? "Done" : "Customize"}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((w) => {
          const def = widgets.find((x) => x.id === w.id);
          if (!def) return null;
          const isVisible = visibleIds.has(w.id);
          if (!isVisible && !editing) return null;
          return (
            <div
              key={w.id}
              draggable={editing}
              onDragStart={() => setDrag(w.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder(w.id)}
              className={cn(
                "relative transition-opacity",
                editing && "ring-1 ring-dashed ring-border rounded-lg",
                editing && drag === w.id && "opacity-30",
                !isVisible && "opacity-60",
              )}
            >
              {editing && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6 bg-background"
                    onClick={() => setVisible(w.id, !isVisible)}
                  >
                    {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              {editing && (
                <div className="absolute left-1 top-1 z-10 cursor-grab text-muted-foreground">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              )}
              {def.render()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "warning";
  compact?: boolean;
}) {
  return (
    <Card>
      <CardContent className={cn("flex items-center gap-3", compact ? "p-3" : "p-5")}>
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

function UpcomingWidget({ tasks }: { tasks: TaskRecord[] }) {
  const sorted = [...tasks].sort((a, b) => (a.due ?? "").localeCompare(b.due ?? "")).slice(0, 5);
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Up next</CardTitle></CardHeader>
      <CardContent className="space-y-1 p-3 pt-0">
        {sorted.length === 0 && <p className="text-xs text-muted-foreground">Nothing scheduled.</p>}
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-xs">
            <span className="truncate">{t.title}</span>
            <span className="text-muted-foreground">
              {t.due && new Date(t.due).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const PRIORITY_TONES: Record<Priority, string> = {
  urgent: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
  none: "bg-muted",
};

function PriorityWidget({ tasks }: { tasks: TaskRecord[] }) {
  const counts: Record<Priority, number> = { urgent: 0, high: 0, medium: 0, low: 0, none: 0 };
  for (const t of tasks) if (!t.done) counts[t.priority]++;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">By priority</CardTitle></CardHeader>
      <CardContent className="space-y-1 p-3 pt-0 text-xs">
        {(Object.keys(counts) as Priority[]).map((p) => (
          <div key={p} className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", PRIORITY_TONES[p])} />
            <span className="capitalize">{p}</span>
            <span className="ml-auto font-medium">{counts[p]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProjectsWidget({ projects, tasks }: { projects: { id: string; name: string }[]; tasks: TaskRecord[] }) {
  const nav = useNavigate();
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Projects</CardTitle></CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground">No projects yet.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Projects</CardTitle></CardHeader>
      <CardContent className="space-y-1.5 p-3 pt-0">
        {projects.slice(0, 5).map((p) => {
          const items = tasks.filter((t) => t.project === p.id);
          const done = items.filter((t) => t.done).length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;
          return (
            <button
              key={p.id}
              onClick={() => nav(`/projects/${p.id}`)}
              className="block w-full text-left"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{p.name}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StreakWidget({ tasks }: { tasks: TaskRecord[] }) {
  const completedDays = new Set<string>();
  for (const t of tasks) {
    if (t.completed_at) {
      const d = new Date(t.completed_at);
      completedDays.add(d.toDateString());
    }
  }
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (completedDays.has(cur.toDateString())) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Streak</CardTitle></CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-3xl font-semibold">{streak}</div>
        <div className="text-xs text-muted-foreground">day{streak === 1 ? "" : "s"} of completed tasks</div>
      </CardContent>
    </Card>
  );
}
