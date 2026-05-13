import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import AppLayout from "@/components/layout/AppLayout";

import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import OnboardingPage from "@/pages/OnboardingPage";

import DashboardPage from "@/pages/DashboardPage";
import SessionsPage from "@/pages/sessions/SessionsPage";
import CoachNotesPage from "@/pages/CoachNotesPage";

import ProgressPage from "@/pages/progress/ProgressPage";
import ChartsPage from "@/pages/progress/ChartsPage";
import MilestonesPage from "@/pages/progress/MilestonesPage";
import TrendsPage from "@/pages/progress/TrendsPage";

import ClientsPage from "@/pages/coach/ClientsPage";
import ClientDetailPage from "@/pages/coach/ClientDetailPage";
import PlaybookPage from "@/pages/coach/PlaybookPage";

import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminProgramsPage from "@/pages/admin/AdminProgramsPage";
import RoadmapMonitor from "@/pages/monitor/RoadmapMonitor";

const queryClient = new QueryClient();

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#EDE4D3" }}>
      {children}
    </div>
  );
}

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  if (!profile?.onboarding_done && window.location.pathname !== "/onboarding") return <Redirect to="/onboarding" />;
  if (roles && profile && !roles.includes(profile.role)) return <Redirect to="/dashboard" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login">
        <AuthLayout><LoginPage /></AuthLayout>
      </Route>
      <Route path="/signup">
        <AuthLayout><SignupPage /></AuthLayout>
      </Route>
      <Route path="/forgot-password">
        <AuthLayout><ForgotPasswordPage /></AuthLayout>
      </Route>
      <Route path="/reset-password">
        <AuthLayout><ResetPasswordPage /></AuthLayout>
      </Route>
      <Route path="/onboarding" component={OnboardingPage} />

      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/sessions">
        <ProtectedRoute component={SessionsPage} />
      </Route>
      <Route path="/coach-notes">
        <ProtectedRoute component={CoachNotesPage} />
      </Route>

      <Route path="/progress">
        <ProtectedRoute component={ProgressPage} />
      </Route>
      <Route path="/progress/charts">
        <ProtectedRoute component={ChartsPage} />
      </Route>
      <Route path="/progress/milestones">
        <ProtectedRoute component={MilestonesPage} />
      </Route>
      <Route path="/progress/trends">
        <ProtectedRoute component={TrendsPage} />
      </Route>

      <Route path="/clients">
        <ProtectedRoute component={ClientsPage} roles={["coach", "admin"]} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute component={ClientDetailPage} roles={["coach", "admin"]} />
      </Route>
      <Route path="/playbook">
        <ProtectedRoute component={PlaybookPage} roles={["coach", "admin"]} />
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute component={AdminUsersPage} roles={["admin"]} />
      </Route>
      <Route path="/admin/programs">
        <ProtectedRoute component={AdminProgramsPage} roles={["admin"]} />
      </Route>

      <Route path="/monitor/roadmap" component={RoadmapMonitor} />

      <Route>
        <Redirect to="/dashboard" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
