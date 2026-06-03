import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdatePreferences } from "@/lib/preferences";
import { COMPLEXITY_META } from "@/lib/features";
import { cn } from "@/lib/utils";
import type { Accent, Complexity, Theme } from "@/lib/pb";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LEVELS: Complexity[] = ["simple", "balanced", "advanced"];
const ACCENTS: { value: Accent; hex: string }[] = [
  { value: "indigo", hex: "#6366f1" },
  { value: "violet", hex: "#8b5cf6" },
  { value: "blue", hex: "#3b82f6" },
  { value: "emerald", hex: "#10b981" },
  { value: "amber", hex: "#f59e0b" },
  { value: "rose", hex: "#f43f5e" },
  { value: "teal", hex: "#14b8a6" },
];
const THEMES: Theme[] = ["system", "light", "dark"];

export function OnboardingPage() {
  const [step, setStep] = useState<0 | 1>(0);
  const [complexity, setComplexity] = useState<Complexity>("balanced");
  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState<Accent>("indigo");
  const [saving, setSaving] = useState(false);
  const update = useUpdatePreferences();
  const nav = useNavigate();

  async function finish() {
    setSaving(true);
    try {
      await update.mutateAsync({ complexity, theme, accent, onboarded: true });
      toast.success("Welcome to Current");
      nav("/today", { replace: true });
    } catch {
      toast.error("Couldn't save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full overflow-y-auto bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> {step === 0 ? "Personal setup" : "Personalize"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {step === 0 ? "How do you want to use Current?" : "Make it yours"}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {step === 0
              ? "Choose how much complexity you want today. Current grows with you — you can change this any time in settings."
              : "Pick your theme and accent. You can change every detail later in Settings."}
          </p>
        </motion.div>

        {step === 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {LEVELS.map((level, i) => {
              const meta = COMPLEXITY_META[level];
              const selected = complexity === level;
              return (
                <motion.button
                  key={level}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  onClick={() => setComplexity(level)}
                  className={cn(
                    "group relative flex h-full flex-col gap-2 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/60 hover:shadow",
                    selected && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">{meta.title}</span>
                    {selected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-primary">{meta.tagline}</span>
                  <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm font-semibold">Theme</div>
              <div className="mt-3 flex gap-2">
                {THEMES.map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(t)}
                    className="capitalize"
                  >{t}</Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm font-semibold">Accent</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAccent(a.value)}
                    className={cn(
                      "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                      accent === a.value && "ring-2 ring-ring",
                    )}
                    style={{ background: a.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <span>Complexity is optional. You can always change this later.</span>
          <div className="flex gap-2">
            {step === 1 && (
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
            )}
            {step === 0 ? (
              <Button onClick={() => setStep(1)} size="lg">Next</Button>
            ) : (
              <Button onClick={finish} disabled={saving} size="lg">Get started</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
