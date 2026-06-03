import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePreferences, useUpdatePreferences } from "@/lib/preferences";
import { COMPLEXITY_META } from "@/lib/features";
import { cn } from "@/lib/utils";
import type { Accent, Complexity, Density, Theme } from "@/lib/pb";
import { toast } from "sonner";

const ACCENTS: { value: Accent; hex: string }[] = [
  { value: "indigo", hex: "#6366f1" },
  { value: "violet", hex: "#8b5cf6" },
  { value: "blue", hex: "#3b82f6" },
  { value: "emerald", hex: "#10b981" },
  { value: "amber", hex: "#f59e0b" },
  { value: "rose", hex: "#f43f5e" },
  { value: "slate", hex: "#475569" },
];
const THEMES: Theme[] = ["system", "light", "dark"];
const DENSITIES: Density[] = ["compact", "comfortable", "spacious"];
const LEVELS: Complexity[] = ["simple", "balanced", "advanced"];

export function SettingsPage() {
  const prefs = usePreferences();
  const update = useUpdatePreferences();

  async function patch<K extends keyof NonNullable<typeof prefs.data>>(
    key: K,
    value: NonNullable<typeof prefs.data>[K],
  ) {
    try {
      await update.mutateAsync({ [key]: value } as unknown as Partial<NonNullable<typeof prefs.data>>);
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save");
    }
  }

  if (!prefs.data) return null;
  const p = prefs.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Make Current yours.</p>
      </header>

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="complexity">Complexity</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Light, dark, or follow your system.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {THEMES.map((t) => (
                <Button
                  key={t}
                  variant={p.theme === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch("theme", t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent color</CardTitle>
              <CardDescription>The color used for primary actions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => patch("accent", a.value)}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                    p.accent === a.value && "ring-2 ring-ring",
                  )}
                  style={{ background: a.hex }}
                  aria-label={a.value}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Density</CardTitle>
              <CardDescription>How tight rows feel.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {DENSITIES.map((d) => (
                <Button
                  key={d}
                  variant={p.density === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch("density", d)}
                  className="capitalize"
                >
                  {d}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complexity" className="space-y-3">
          {LEVELS.map((level) => {
            const m = COMPLEXITY_META[level];
            const selected = p.complexity === level;
            return (
              <Card
                key={level}
                className={cn(
                  "cursor-pointer transition-colors",
                  selected && "border-primary ring-2 ring-primary/20",
                )}
                onClick={() => patch("complexity", level)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {m.title}
                    {selected && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Active
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{m.tagline}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="account" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Your data</CardTitle>
              <CardDescription>
                Current is self-hosted. Your data lives in your PocketBase instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <Label>PocketBase endpoint</Label>
              <code className="block rounded-md bg-muted px-2 py-1 text-xs">
                {import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090"}
              </code>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
