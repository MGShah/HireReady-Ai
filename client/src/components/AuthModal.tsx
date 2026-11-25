import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles, FileText, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: "resume" | "interview" | "skills" | "applications" | "general";
  redirectPath?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = "Unlock Your Full Career Potential",
  description = "Create a free account or sign in to build ATS-friendly resumes, practice AI interviews, and track your career growth.",
  feature = "general",
  redirectPath = "/resume",
}: AuthModalProps) {
  if (!isOpen) return null;

  const featureHighlights = {
    resume: {
      tag: "Resume Builder",
      heading: "Sign up to build your ATS-ready resume",
      sub: "Fill in your profile once during sign-up, and we'll automatically format, design, and populate your resume sections!",
      icon: FileText,
      perks: [
        "Sign-up details directly populate your resume",
        "ATS-optimized professional templates",
        "Instant one-click PDF export",
        "AI-assisted summaries and bullet points",
      ],
    },
    interview: {
      tag: "AI Interview Lab",
      heading: "Sign up for AI Mock Interviews",
      sub: "Practice realistic role-based technical and behavioral interviews with real-time feedback.",
      icon: Sparkles,
      perks: [
        "Custom questions matched to your target role",
        "Instant answer evaluation & scoring",
        "Actionable advice to improve confidence",
        "Track progress across interview sessions",
      ],
    },
    skills: {
      tag: "Skill Gap Analyzer",
      heading: "Sign up to analyze your skill gaps",
      sub: "Benchmark your skills against real job market requirements and get personalized learning roadmaps.",
      icon: Sparkles,
      perks: [
        "Identify high-demand missing skills",
        "Personalized learning time planner",
        "Market competitiveness score",
        "Tailored resource recommendations",
      ],
    },
    applications: {
      tag: "Application Tracker",
      heading: "Sign up to track your job pipeline",
      sub: "Keep all your job applications organized in one unified visual dashboard.",
      icon: ShieldCheck,
      perks: [
        "Visual stages from Saved to Offer",
        "Timeline tracking and status updates",
        "Interview date reminders",
        "Integrated notes and salary details",
      ],
    },
    general: {
      tag: "hireReady-AI AI",
      heading: "Create your free account",
      sub: "Sign up now to get full access to all career acceleration tools.",
      icon: Sparkles,
      perks: [
        "Direct resume pre-filling from sign-up",
        "AI mock interview simulations",
        "Role-based skill gap roadmaps",
        "Complete application pipeline tracking",
      ],
    },
  }[feature];

  const Icon = featureHighlights.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={18} />
        </button>

        <div className="mb-3 flex flex-wrap items-center gap-2 pr-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <Icon size={13} />
            {featureHighlights.tag}
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Sparkles size={12} /> Free Account
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          {title || featureHighlights.heading}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {description || featureHighlights.sub}
        </p>

        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
            What you'll get:
          </p>
          <ul className="mt-2.5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {featureHighlights.perks.map((perk, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            to={`/login?mode=signup&redirect=${encodeURIComponent(redirectPath)}`}
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
          >
            Create Account & Pre-fill Resume <ArrowRight size={15} />
          </Link>
          <Link
            to={`/login?mode=login&redirect=${encodeURIComponent(redirectPath)}`}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            I already have an account
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Takes less than 1 minute • Free forever basic plan • No credit card required
        </p>
      </div>
    </div>
  );
}
