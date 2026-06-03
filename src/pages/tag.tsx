import { useParams } from "react-router-dom";
import { useState } from "react";
import { Columns3, List as ListIcon } from "lucide-react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { BoardView } from "@/components/board";
import { Button } from "@/components/ui/button";
import { useTags, useTasks } from "@/lib/queries";

export function TagPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [view, setView] = useState<"list" | "board">("list");
  const tags = useTags();
  const tag = tags.data?.find((t) => t.id === id);
  const tasks = useTasks({ tag: id, done: false });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={tag?.color ? { color: tag.color } : undefined}>
            #{tag?.name ?? "tag"}
          </h1>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <ListIcon className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant={view === "board" ? "default" : "outline"} onClick={() => setView("board")}>
            <Columns3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <QuickAdd defaults={{ tags: [id] }} />

      {view === "list" ? <TaskList tasks={tasks.data ?? []} reorderable /> : <BoardView />}
    </div>
  );
}
