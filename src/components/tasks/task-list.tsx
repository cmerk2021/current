import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CalendarDays, Flag, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteTask, useUpdateTask } from "@/lib/queries";
import type { Priority, TaskRecord } from "@/lib/pb";
import { usePreferences } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { cn, formatDate } from "@/lib/utils";

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  none: { label: "None", cls: "text-muted-foreground" },
  low: { label: "Low", cls: "text-sky-500" },
  medium: { label: "Med", cls: "text-amber-500" },
  high: { label: "High", cls: "text-orange-500" },
  urgent: { label: "Urgent", cls: "text-rose-500" },
};

export function TaskItem({ task }: { task: TaskRecord }) {
  const update = useUpdateTask();
  const del = useDeleteTask();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  function commit() {
    const next = title.trim();
    if (next && next !== task.title) {
      update.mutate({ id: task.id, patch: { title: next } });
    } else {
      setTitle(task.title);
    }
    setEditing(false);
  }

  const overdue =
    !task.done && task.due && new Date(task.due) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="group flex items-start gap-3 border-b border-border/60 row-pad pr-2"
    >
      <div className="pt-0.5">
        <Checkbox
          checked={task.done}
          onCheckedChange={(c) => update.mutate({ id: task.id, patch: { done: c } })}
        />
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setTitle(task.title);
                setEditing(false);
              }
            }}
            className="h-7 px-1.5 text-sm"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={cn(
              "block w-full text-left text-sm",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {features.dueDates && task.due && (
            <Badge variant={overdue ? "destructive" : "muted"}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.due)}
            </Badge>
          )}
          {features.priorities && task.priority !== "none" && (
            <Badge variant="outline" className={PRIORITY_META[task.priority].cls}>
              <Flag className="h-3 w-3" />
              {PRIORITY_META[task.priority].label}
            </Badge>
          )}
        </div>
      </div>

      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => del.mutate(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function TaskList({ tasks }: { tasks: TaskRecord[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
        Nothing here yet. Add your first task above.
      </div>
    );
  }
  return (
    <div className="surface divide-y divide-border/60 overflow-hidden">
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
