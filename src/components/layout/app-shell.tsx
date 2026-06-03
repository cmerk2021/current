import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command-palette";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const toggleCommand = useUI((s) => s.toggleCommand);

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

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden border-r border-border bg-card/40 transition-all md:flex md:flex-col",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
