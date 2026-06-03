import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/tasks/task-list";
import { useTasks } from "@/lib/queries";

export function SearchPage() {
  const [q, setQ] = useState("");
  const tasks = useTasks({ search: q.length >= 2 ? q : undefined });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      </header>

      <div className="surface flex items-center gap-2 px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : (
        <TaskList tasks={tasks.data ?? []} />
      )}
    </div>
  );
}
