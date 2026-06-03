import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-b from-background to-muted/30 px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-primary-foreground shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
              <path d="M6 15c4 4 8 4 12 0M6 9c4-4 8-4 12 0" strokeLinecap="round" />
            </svg>
          </span>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="surface p-6">{children}</div>
        <p className="text-center text-[11px] text-muted-foreground">
          Current — complexity is optional.
        </p>
      </div>
    </div>
  );
}
