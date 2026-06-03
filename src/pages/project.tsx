import { useParams } from "react-router-dom";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { useProjects, useTasks } from "@/lib/queries";
import { LoadingScreen } from "@/components/loading-screen";

export function ProjectPage() {
  const { id = "" } = useParams<{ id: string }>();
  const projects = useProjects();
  const tasks = useTasks({ project: id, done: false });
  const project = projects.data?.find((p) => p.id === id);

  if (tasks.isLoading || projects.isLoading) return <LoadingScreen />;
  if (!project) {
    return (
      <div className="surface p-10 text-center text-sm text-muted-foreground">
        That project doesn't exist or was removed.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        {project.notes && (
          <p className="mt-1 text-sm text-muted-foreground">{project.notes.slice(0, 200)}</p>
        )}
      </header>

      <QuickAdd defaults={{ project: id }} placeholder={`Add to ${project.name}…`} />

      <section className="space-y-2">
        <TaskList tasks={tasks.data ?? []} />
      </section>
    </div>
  );
}
