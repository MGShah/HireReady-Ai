import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Session } from "../lib/auth";
import { FileText, Sparkles, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

interface ProtectedRouteProps {
  session: Session | null | undefined;
  children: ReactNode;
}

export default function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation();

  if (session) {
    return <>{children}</>;
  }

  const isResume = location.pathname.startsWith("/resume");
  const isInterview = location.pathname.startsWith("/interview");
  const isSkills = location.pathname.startsWith("/skills");
  const isApplications = location.pathname.startsWith("/applications");
  const isAdmin = location.pathname.startsWith("/admin");

  const featureTitle = isAdmin
    ? "Admin Control Center"
    : isResume
    ? "AI Resume Builder"
    : isInterview
    ? "AI Mock Interview Lab"
    : isSkills
    ? "Skill Gap Analyzer"
    : isApplications
    ? "Application Pipeline Tracker"
    : "Career Workspace";

  const featureBenefit = isAdmin
    ? "Platform management, candidate telemetry, and system controls are restricted to verified administrators. Please sign in with your admin account (e.g. mahekgshah@gmail.com)."
    : isResume
    ? "When you sign up, your profile details are automatically added into your resume so you can build and export ATS-ready resumes in minutes!"
    : isInterview
    ? "Practice realistic role-based technical and behavioral interviews with real-time feedback and scoring."
    : isSkills
    ? "Compare your skillset with industry standards, identify gaps, and follow tailored learning plans."
    : "Track and organize your entire job search pipeline in one place.";

  return (
    <div className="mx-auto max-w-2xl py-12 px-4 sm:px-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400 mb-6 shadow-sm">
        {isResume ? <FileText size={32} /> : <Lock size={30} />}
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 mb-3">
        <Sparkles size={13} /> Sign in or Sign up required
      </span>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Access {featureTitle}
      </h1>

      <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
        {featureBenefit}
      </p>

      {isResume && (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-left dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
            ✨ Instant Resume Pre-population:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
              <span>Full Name, Headline & Contact Info automatically loaded</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
              <span>Education, College & Graduation Year directly placed in Education section</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
              <span>Skills & Professional Summary drafted from your sign-up responses</span>
            </li>
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={`/login?mode=signup&redirect=${encodeURIComponent(location.pathname)}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition"
        >
          Create Account & Pre-fill Details <ArrowRight size={16} />
        </Link>
        <Link
          to={`/login?mode=login&redirect=${encodeURIComponent(location.pathname)}`}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
        >
          Log In to Existing Account
        </Link>
      </div>

      <div className="mt-6">
        <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}
