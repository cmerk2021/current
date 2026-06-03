import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/auth/login";
import { SignupPage } from "@/pages/auth/signup";
import { OnboardingPage } from "@/pages/onboarding";
import { TodayPage } from "@/pages/today";
import { UpcomingPage } from "@/pages/upcoming";
import { ListPage } from "@/pages/list";
import { ProjectPage } from "@/pages/project";
import { DashboardPage } from "@/pages/dashboard";
import { SettingsPage } from "@/pages/settings";
import { SearchPage } from "@/pages/search";
import { LoadingScreen } from "@/components/loading-screen";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthedApp />;
}

function AuthedApp() {
  const prefs = usePreferences();

  if (prefs.isLoading || !prefs.data) return <LoadingScreen />;

  if (!prefs.data.onboarded) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/lists/:id" element={<ListPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </AppShell>
  );
}
