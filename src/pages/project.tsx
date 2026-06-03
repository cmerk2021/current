import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Columns3, List as ListIcon, MoreHorizontal, Trash2, TrendingUp } from "lucide-react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { BoardView } from "@/components/board";
import { IconPicker } from "@/components/icon-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useAreas,
  useDeleteProject,
  useProjects,
  useTasks,
  useUpdateProject,
} from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";
import { Textarea } from "@/components/ui/textarea";
import { featuresFor } from "@/lib/features";
import { usePreferences } from "@/lib/preferences";
import { toast } from "sonner";
import type { ProjectStatus } from "@/lib/pb";

const STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];

export function ProjectPage() {
  const { id = "" } = useParams<{ id: string }>();
  const projects = useProjects();
  const areas = useAreas();
  const tasks = useTasks({ project: id, done: false });
  const completed = useTasks({ project: id, done: true });
  const update = useUpdateProject();
  const del = useDeleteProject();
  const project = projects.data?.find((p) => p.id === id);
  const nav = useNavigate();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const [view, setView] = useState<"list" | "board">("list");
  const [notes, setNotes] = useState(project?.notes ?? "");

  if (tasks.isLoading || projects.isLoading) return <LoadingScreen />;
  if (!project) {
    return (
      <div className="surface p-10 text-center text-sm text-muted-foreground">
        That project doesn't exist or was removed.
      </div>
    );
  }

  const open = tasks.data ?? [];
  const done = completed.data ?? [];
  const total = open.length + done.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <IconPicker
              value={project.icon}
              onChange={(icon) => update.mutate({ id, patch: { icon: icon ?? "" } })}
              fallback={TrendingUp}
              color={project.color}
            />
            <input
              value={project.name}
              onChange={(e) => update.mutate({ id, patch: { name: e.target.value } })}
              className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select
              value={project.status}
              onValueChange={(v) => update.mutate({ id, patch: { status: v as ProjectStatus } })}
            >
              <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}><span className="capitalize">{s.replace("_", " ")}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            {features.areas && areas.data && areas.data.length > 0 && (
              <Select
                value={project.area ?? "__none"}
                onValueChange={(v) => update.mutate({ id, patch: { area: v === "__none" ? undefined : v } })}
              >
                <SelectTrigger className="h-7 w-32"><SelectValue placeholder="No area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No area</SelectItem>
                  {areas.data.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Badge variant="muted">{pct}% complete</Badge>
            <Badge variant="muted">{open.length} open</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <ListIcon className="h-3.5 w-3.5" />
          </Button>
          {features.board && (
            <Button size="sm" variant={view === "board" ? "default" : "outline"} onClick={() => setView("board")}>
              <Columns3 className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={() => {
                if (confirm(`Delete "${project.name}"?`)) {
                  del.mutate(id);
                  toast.success("Project deleted");
                  nav("/today");
                }
              }}>
                <Trash2 className="h-4 w-4" /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {features.notes && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (project.notes ?? "") && update.mutate({ id, patch: { notes } })}
          placeholder="Project notes…"
          className="min-h-[80px]"
        />
      )}

      <QuickAdd defaults={{ project: id }} placeholder={`Add to ${project.name}…`} />

      {view === "list" ? (
        <>
          <TaskList tasks={open} reorderable />
          {done.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </h2>
              <TaskList tasks={done} />
            </section>
          )}
        </>
      ) : (
        <BoardView filter={{ project: id }} />
      )}
    </div>
  );
}
