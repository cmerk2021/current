import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function InboxPage() {
  // Catch-all for unfiled tasks: no list, no project, no due, no scheduled.
  // Tasks added from the command palette (or any view with no context) land here.
  const tasks = useTasks({ inbox: true, done: false });

  if (tasks.isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unfiled tasks land here. Triage when you're ready.
        </p>
      </header>

      <QuickAdd placeholder="Capture a thought…" />

      <TaskList tasks={tasks.data ?? []} />
    </div>
  );
}
