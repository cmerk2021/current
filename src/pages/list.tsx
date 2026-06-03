import { useParams } from "react-router-dom";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { useLists, useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function ListPage() {
  const { id = "" } = useParams<{ id: string }>();
  const lists = useLists();
  const tasks = useTasks({ list: id, done: false });
  const completed = useTasks({ list: id, done: true });
  const list = lists.data?.find((l) => l.id === id);

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
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{list.name}</h1>
      </header>

      <QuickAdd defaults={{ list: id }} placeholder={`Add to ${list.name}…`} />

      <section className="space-y-2">
        <TaskList tasks={tasks.data ?? []} />
      </section>

      {completed.data && completed.data.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed
          </h2>
          <TaskList tasks={completed.data} />
        </section>
      )}
    </div>
  );
}
