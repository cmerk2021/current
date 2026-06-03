import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { readUI, usePreferences } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/auth/login";
import { SignupPage } from "@/pages/auth/signup";
import { OnboardingPage } from "@/pages/onboarding";
import { TodayPage } from "@/pages/today";
import { InboxPage } from "@/pages/inbox";
import { UpcomingPage } from "@/pages/upcoming";
import { ListPage } from "@/pages/list";
import { ProjectPage } from "@/pages/project";
import { DashboardPage } from "@/pages/dashboard";
import { SettingsPage } from "@/pages/settings";
import { SearchPage } from "@/pages/search";
import { CalendarPage } from "@/pages/calendar";
import { AreasPage } from "@/pages/areas";
import { TagsPage } from "@/pages/tags";
import { TagPage } from "@/pages/tag";
import { SmartFiltersPage, SmartFilterPage } from "@/pages/smart-filters";
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

  const features = featuresFor(prefs.data.complexity);
  const ui = readUI(prefs.data);
  const home = `/${ui.defaultView ?? "today"}`;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        {features.calendar && <Route path="/calendar" element={<CalendarPage />} />}
        {features.dashboard && <Route path="/dashboard" element={<DashboardPage />} />}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/lists/:id" element={<ListPage />} />
        {features.projects && <Route path="/projects/:id" element={<ProjectPage />} />}
        {features.areas && <Route path="/areas" element={<AreasPage />} />}
        {features.tags && <Route path="/tags" element={<TagsPage />} />}
        {features.tags && <Route path="/tags/:id" element={<TagPage />} />}
        {features.smartFilters && <Route path="/smart-filters" element={<SmartFiltersPage />} />}
        {features.smartFilters && <Route path="/smart-filters/:id" element={<SmartFilterPage />} />}
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </AppShell>
  );
}
