import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command-palette";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useUI } from "@/lib/ui-store";
import { readSidebar, usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const toggleCommand = useUI((s) => s.toggleCommand);
  const prefs = usePreferences();
  const sidebar = readSidebar(prefs.data);
  const position = sidebar.position ?? "left";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCommand]);

  const aside = (
    <aside
      className={cn(
        "hidden border-border bg-card/40 transition-all md:flex md:flex-col",
        position === "right" ? "border-l" : "border-r",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden",
      )}
    >
      <Sidebar />
    </aside>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {position === "left" && aside}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
      {position === "right" && aside}
      <CommandPalette />
      <TaskDetailDialog />
    </div>
  );
}
