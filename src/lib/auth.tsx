import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pb, type UserRecord } from "@/lib/pb";

interface AuthContextValue {
  user: UserRecord | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    pb.authStore.isValid ? (pb.authStore.record as unknown as UserRecord) : null,
  );
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(!pb.authStore.isValid);

  useEffect(() => {
    const unsub = pb.authStore.onChange((_token, record) => {
      setUser(record ? (record as unknown as UserRecord) : null);
    });
    return () => unsub();
  }, []);

  // Validate any persisted token against the server. A locally-valid JWT can
  // still be unusable (the user was deleted, the PocketBase instance was
  // reset, or the token came from a different deployment). If the refresh
  // fails we clear the store so the app falls back to the login screen.
  useEffect(() => {
    if (bootstrapped) return;
    let cancelled = false;
    (async () => {
      try {
        await pb.collection("users").authRefresh();
      } catch {
        pb.authStore.clear();
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: loading || !bootstrapped,
      async signIn(email, password) {
        setLoading(true);
        try {
          await pb.collection("users").authWithPassword(email, password);
        } finally {
          setLoading(false);
        }
      },
      async signUp(email, password, name) {
        setLoading(true);
        try {
          await pb.collection("users").create({
            email,
            password,
            passwordConfirm: password,
            name: name ?? "",
          });
          await pb.collection("users").authWithPassword(email, password);
        } finally {
          setLoading(false);
        }
      },
      signOut() {
        pb.authStore.clear();
      },
    }),
    [user, loading, bootstrapped],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
