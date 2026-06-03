import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_UI,
  readSidebar,
  readUI,
  usePreferences,
  useUpdatePreferences,
  useUpdateSidebar,
  useUpdateUI,
} from "@/lib/preferences";
import { COMPLEXITY_META } from "@/lib/features";
import { cn } from "@/lib/utils";
import type {
  Accent,
  Complexity,
  Density,
  FontFamily,
  FontSize,
  Radius,
  SidebarPosition,
  Theme,
  WeekStart,
  DefaultView,
} from "@/lib/pb";
import { toast } from "sonner";

const ACCENTS: { value: Accent; hex: string; label: string }[] = [
  { value: "indigo", hex: "#6366f1", label: "Indigo" },
  { value: "violet", hex: "#8b5cf6", label: "Violet" },
  { value: "blue", hex: "#3b82f6", label: "Blue" },
  { value: "teal", hex: "#14b8a6", label: "Teal" },
  { value: "emerald", hex: "#10b981", label: "Emerald" },
  { value: "lime", hex: "#84cc16", label: "Lime" },
  { value: "amber", hex: "#f59e0b", label: "Amber" },
  { value: "orange", hex: "#f97316", label: "Orange" },
  { value: "rose", hex: "#f43f5e", label: "Rose" },
  { value: "fuchsia", hex: "#d946ef", label: "Fuchsia" },
  { value: "slate", hex: "#475569", label: "Slate" },
];
const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "amoled", label: "AMOLED" },
];
const DENSITIES: Density[] = ["compact", "comfortable", "spacious"];
const RADII: Radius[] = ["none", "small", "medium", "large", "full"];
const FONTS: { value: FontFamily; label: string }[] = [
  { value: "system", label: "System" },
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];
const FONT_SIZES: FontSize[] = ["small", "medium", "large"];
const LEVELS: Complexity[] = ["simple", "balanced", "advanced"];

export function SettingsPage() {
  const prefs = usePreferences();
  const update = useUpdatePreferences();
  const updateUI = useUpdateUI();
  const updateSidebar = useUpdateSidebar();

  async function patch<K extends keyof NonNullable<typeof prefs.data>>(
    key: K,
    value: NonNullable<typeof prefs.data>[K],
  ) {
    try {
      await update.mutateAsync({ [key]: value } as unknown as Partial<NonNullable<typeof prefs.data>>);
    } catch {
      toast.error("Couldn't save");
    }
  }

  if (!prefs.data) return null;
  const p = prefs.data;
  const ui = readUI(p);
  const sb = readSidebar(p);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Make Current yours.</p>
      </header>

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="complexity">Complexity</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* APPEARANCE */}
        <TabsContent value="appearance" className="space-y-4">
          <SettingCard title="Theme" description="Light, dark, or follow your system.">
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <Button
                  key={t.value}
                  variant={p.theme === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch("theme", t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Accent color" description="The color used for primary actions.">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => {
                    patch("accent", a.value);
                    updateUI({ customAccent: null });
                  }}
                  title={a.label}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                    p.accent === a.value && !ui.customAccent && "ring-2 ring-ring",
                  )}
                  style={{ background: a.hex }}
                  aria-label={a.value}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Label className="text-xs">Custom hex</Label>
              <Input
                placeholder="#7c3aed"
                defaultValue={ui.customAccent ?? ""}
                onBlur={(e) => updateUI({ customAccent: e.target.value || null })}
                className="h-8 w-32"
              />
              {ui.customAccent && (
                <Button variant="ghost" size="sm" onClick={() => updateUI({ customAccent: null })}>
                  Clear
                </Button>
              )}
            </div>
          </SettingCard>

          <SettingCard title="Roundness" description="How rounded corners feel.">
            <div className="flex gap-2">
              {RADII.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={ui.radius === r ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => updateUI({ radius: r })}
                >
                  {r}
                </Button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Typography" description="Font family and base size.">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={ui.fontFamily ?? "system"} onValueChange={(v) => updateUI({ fontFamily: v as FontFamily })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                {FONT_SIZES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={ui.fontSize === s ? "default" : "outline"}
                    className="capitalize"
                    onClick={() => updateUI({ fontSize: s })}
                  >{s}</Button>
                ))}
              </div>
            </div>
          </SettingCard>

          <SettingCard title="Density" description="How tight rows feel.">
            <div className="flex gap-2">
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
            </div>
          </SettingCard>
        </TabsContent>

        {/* LAYOUT */}
        <TabsContent value="layout" className="space-y-4">
          <SettingCard title="Sidebar position" description="Which side the sidebar lives on.">
            <div className="flex gap-2">
              {(["left", "right"] as SidebarPosition[]).map((pos) => (
                <Button
                  key={pos}
                  size="sm"
                  variant={sb.position === pos ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => updateSidebar({ position: pos })}
                >{pos}</Button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Sidebar sections" description="Hide sections you don't use.">
            <div className="space-y-2">
              {(["favorites", "lists", "projects", "areas", "smart_filters", "tags"] as const).map((k) => {
                const visible = !sb.hidden?.includes(k);
                return (
                  <div key={k} className="flex items-center justify-between">
                    <Label className="capitalize">{k.replace("_", " ")}</Label>
                    <Switch
                      checked={visible}
                      onCheckedChange={(v) => {
                        const cur = new Set(sb.hidden ?? []);
                        if (v) cur.delete(k);
                        else cur.add(k);
                        updateSidebar({ hidden: Array.from(cur) });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </SettingCard>
        </TabsContent>

        {/* BEHAVIOR */}
        <TabsContent value="behavior" className="space-y-4">
          <SettingCard title="Default view" description="Where you land when the app opens.">
            <Select value={ui.defaultView ?? "today"} onValueChange={(v) => updateUI({ defaultView: v as DefaultView })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="inbox">Inbox</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
              </SelectContent>
            </Select>
          </SettingCard>

          <SettingCard title="Week starts on" description="Used by Calendar and Upcoming.">
            <div className="flex gap-2">
              {([{ v: 0, l: "Sunday" }, { v: 1, l: "Monday" }, { v: 6, l: "Saturday" }] as { v: WeekStart; l: string }[]).map((d) => (
                <Button
                  key={d.v}
                  size="sm"
                  variant={ui.weekStartsOn === d.v ? "default" : "outline"}
                  onClick={() => updateUI({ weekStartsOn: d.v })}
                >{d.l}</Button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Show completed tasks" description="Display completed sections inline.">
            <Switch checked={ui.showCompleted !== false} onCheckedChange={(v) => updateUI({ showCompleted: v })} />
          </SettingCard>

          <SettingCard title="Reduce motion" description="Disable animations and transitions.">
            <Switch checked={!!ui.reducedMotion} onCheckedChange={(v) => updateUI({ reducedMotion: v })} />
          </SettingCard>

          <SettingCard title="Confetti on complete" description="Tiny celebration when you finish a task.">
            <Switch checked={!!ui.confetti} onCheckedChange={(v) => updateUI({ confetti: v })} />
          </SettingCard>

          <SettingCard title="Reset to defaults" description="Restore all customization to factory defaults.">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await updateUI(DEFAULT_UI);
                toast.success("Restored defaults");
              }}
            >Reset</Button>
          </SettingCard>
        </TabsContent>

        {/* COMPLEXITY */}
        <TabsContent value="complexity" className="space-y-3">
          {LEVELS.map((level) => {
            const m = COMPLEXITY_META[level];
            const selected = p.complexity === level;
            return (
              <Card
                key={level}
                className={cn("cursor-pointer transition-colors", selected && "border-primary ring-2 ring-primary/20")}
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

        {/* ACCOUNT */}
        <TabsContent value="account" className="space-y-3">
          <AccountCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function AccountCard() {
  const prefs = usePreferences();
  const [busy, setBusy] = useState(false);
  if (!prefs.data) return null;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>Current is self-hosted. Your data lives in your PocketBase instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Label>PocketBase endpoint</Label>
          <code className="block rounded-md bg-muted px-2 py-1 text-xs">
            {import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090"}
          </code>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Download a JSON snapshot of all your tasks, lists, projects, and tags.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { pb } = await import("@/lib/pb");
                const collections = ["preferences", "areas", "projects", "lists", "tags", "tasks", "smart_filters"];
                const dump: Record<string, unknown> = {};
                for (const c of collections) {
                  dump[c] = (await pb.collection(c).getFullList()).map((r) => r);
                }
                const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `current-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                toast.error("Export failed");
                console.error(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Exporting…" : "Download JSON"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
