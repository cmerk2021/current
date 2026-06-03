import { useState } from "react";
import { useParams } from "react-router-dom";
import { Columns3, List as ListIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { BoardView } from "@/components/board";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteList, useLists, useTasks, useUpdateList } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";
import { featuresFor } from "@/lib/features";
import { readUI, usePreferences } from "@/lib/preferences";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ListPage() {
  const { id = "" } = useParams<{ id: string }>();
  const lists = useLists();
  const tasks = useTasks({ list: id, done: false });
  const completed = useTasks({ list: id, done: true });
  const update = useUpdateList();
  const del = useDeleteList();
  const list = lists.data?.find((l) => l.id === id);
  const nav = useNavigate();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const ui = readUI(prefs.data);
  const [view, setView] = useState<"list" | "board">("list");

  if (tasks.isLoading || lists.isLoading) return <LoadingScreen />;
  if (!list) {
    return (
      <div className="surface p-10 text-center text-sm text-muted-foreground">
        That list doesn't exist or was removed.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <input
            value={list.name}
            onChange={(e) => update.mutate({ id, patch: { name: e.target.value } })}
            className="w-full bg-transparent text-3xl font-semibold tracking-tight focus:outline-none"
          />
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
              <DropdownMenuItem onClick={() => {
                const next = prompt("Rename list", list.name);
                if (next?.trim()) update.mutate({ id, patch: { name: next.trim() } });
              }}>
                <Pencil className="h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (confirm(`Delete "${list.name}" and its tasks?`)) {
                  del.mutate(id);
                  toast.success("List deleted");
                  nav("/today");
                }
              }} className="text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <QuickAdd defaults={{ list: id }} placeholder={`Add to ${list.name}…`} />

      {view === "list" ? (
        <>
          <section className="space-y-2">
            <TaskList tasks={tasks.data ?? []} reorderable />
          </section>
          {ui.showCompleted && completed.data && completed.data.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </h2>
              <TaskList tasks={completed.data} />
            </section>
          )}
        </>
      ) : (
        <BoardView filter={{ list: id }} />
      )}
    </div>
  );
}
