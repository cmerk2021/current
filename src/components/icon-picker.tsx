import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICON_KEYS, ICON_MAP, resolveIcon } from "@/lib/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (icon: string | null) => void;
  fallback: LucideIcon;
  color?: string;
  className?: string;
}

export function IconPicker({ value, onChange, fallback, color, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const Current = resolveIcon(value, fallback);

  const filtered =
    query.trim().length === 0
      ? ICON_KEYS
      : ICON_KEYS.filter((k) => k.toLowerCase().includes(query.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("h-9 w-9", className)}
          aria-label="Change icon"
        >
          <Current className="h-4 w-4" style={color ? { color } : undefined} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <Input
          autoFocus
          placeholder="Search icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="grid max-h-64 grid-cols-7 gap-1 overflow-y-auto">
          {filtered.map((key) => {
            const Ico = ICON_MAP[key];
            const selected = value === key;
            return (
              <button
                key={key}
                title={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md hover:bg-accent",
                  selected && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                <Ico className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        {value && (
          <div className="mt-2 flex justify-end border-t border-border pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear icon
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
