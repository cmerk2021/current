import { useRef, type ReactNode } from "react";

/**
 * Minimal HTML5-DnD wrapper that fires `onDrop(itemId, columnId)` when
 * a card with `data-dnd-id` is dropped on an element with `data-dnd-col`.
 * Avoids pulling a heavy DnD library for our limited Kanban needs.
 */
export function DndContextLite({
  children,
  onDrop,
}: {
  children: ReactNode;
  onDrop: (itemId: string, columnId: string) => void;
}) {
  const dragId = useRef<string | null>(null);

  return (
    <div
      onDragStart={(e) => {
        const tgt = (e.target as HTMLElement).closest("[data-dnd-id]") as HTMLElement | null;
        if (tgt) {
          dragId.current = tgt.dataset.dndId ?? null;
          if (dragId.current) e.dataTransfer.setData("text/plain", dragId.current);
        }
      }}
      onDragOver={(e) => {
        const col = (e.target as HTMLElement).closest("[data-dnd-col]") as HTMLElement | null;
        if (col && dragId.current) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        const col = (e.target as HTMLElement).closest("[data-dnd-col]") as HTMLElement | null;
        const id = dragId.current;
        if (col && id) {
          onDrop(id, col.dataset.dndCol!);
        }
        dragId.current = null;
      }}
    >
      {children}
    </div>
  );
}
