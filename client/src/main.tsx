import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import type { Session } from "./lib/auth";
import { auth } from "./lib/auth";
import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Skills from "./pages/Skills";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import AdminDashboard from "./pages/AdminDashboard";
import "./index.css";

function LoginRoute({ session }: { session: Session | null }) {
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  if (session) {
    return <Navigate to={redirectTarget} replace />;
  }

  return <Login />;
}

function App() {
  const [session, setSession] = React.useState<Session | null | undefined>(undefined);

  React.useEffect(() => {
    let mounted = true;

    auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data?.session ?? null);
        // Refresh session with database to ensure role/admin permissions are fresh
        auth.refreshSession().then(({ data: freshData }) => {
          if (mounted && freshData?.session) setSession(freshData.session);
        }).catch(() => {});
      })
      .catch(() => {
        if (mounted) setSession(null);
      });

    const { data } = auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading hireReady-AI...</p>
        </div>
      </div>
    );

  }

  return (
    <Routes>
      {/* Auth Route */}
      <Route path="/login" element={<LoginRoute session={session} />} />

      {/* Main Layout containing both Public and Protected Routes */}
      <Route element={<Layout session={session} />}>
        {/* Direct access to Homepage: Dashboard for members, LandingPage for guests */}
        <Route path="/" element={session ? <Dashboard /> : <LandingPage />} />

        {/* Feature Routes protected with friendly auth prompting */}
        <Route
          path="/resume"
          element={
            <ProtectedRoute session={session}>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute session={session}>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <ProtectedRoute session={session}>
              <Skills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute session={session}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute session={session}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session}>
              <AdminDashboard session={session} />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[hireReady-AI] Uncaught app error:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Application Notice</h2>
            <p className="mt-2 text-xs text-slate-400">
              {this.state.error?.message || "An unexpected error occurred while loading the application."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("nexa_cache");
                  } catch {}
                  window.location.reload();
                }}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
              >
                Reload hireReady-AI
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
