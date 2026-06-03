import { useState } from "react";
import { Plus, Hash, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  "#6366f1", "#8b5cf6", "#3b82f6", "#10b981",
  "#f59e0b", "#f43f5e", "#06b6d4", "#a3e635",
];

export function TagsPage() {
  const tags = useTags();
  const create = useCreateTag();
  const update = useUpdateTag();
  const del = useDeleteTag();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);

  async function submit() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), color });
      toast.success("Tag created");
      setName("");
      setOpen(false);
    } catch {
      toast.error("Tag already exists or invalid");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tags</h1>
          <p className="mt-1 text-sm text-muted-foreground">Label tasks across lists and projects.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> New tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>New tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <Label>Color</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {tags.data?.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          No tags yet. Tags let you label tasks across lists and projects.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(tags.data ?? []).map((tg) => (
            <Card key={tg.id}>
              <CardContent className="flex items-center gap-2 p-3">
                <Hash className="h-4 w-4" style={tg.color ? { color: tg.color } : undefined} />
                <span className="flex-1 text-sm font-medium">{tg.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const next = prompt("Rename tag", tg.name);
                    if (next && next.trim() && next !== tg.name) {
                      update.mutate({ id: tg.id, patch: { name: next.trim() } });
                    }
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete tag "${tg.name}"?`)) del.mutate(tg.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
