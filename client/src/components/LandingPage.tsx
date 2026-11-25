import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Mic,
  Target,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import AuthModal from "./AuthModal";

export default function LandingPage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    feature: "resume" | "interview" | "skills" | "applications" | "general";
    redirectPath: string;
  }>({
    isOpen: false,
    feature: "general",
    redirectPath: "/resume",
  });

  const openAuth = (
    feature: "resume" | "interview" | "skills" | "applications" | "general",
    redirectPath: string
  ) => {
    setModalState({ isOpen: true, feature, redirectPath });
  };

  const closeAuth = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="hero-grid relative overflow-hidden rounded-[2rem] border border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-[0_24px_80px_-36px_rgba(79,70,229,0.45)] sm:p-10 lg:p-12 dark:border-indigo-950/60 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/40">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300">
            <Sparkles size={13} className="text-indigo-600 animate-pulse" />
            hireReady-AI · When Talent Meets Intelligence
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Land Your Dream Job with{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Precision AI
            </span>
          </h1>

          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Build ATS-compliant resumes in seconds, practice realistic role-based AI interviews,
            and pinpoint your skill gaps — all in one unified career workspace.
          </p>

          {/* Quick Sign-up Benefit Highlight */}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 sm:inline-flex sm:items-center">
            <Zap size={14} className="shrink-0 text-amber-600" />
            <span>
              <strong>Smart Onboarding:</strong> Enter your details during sign-up and your resume is instantly pre-filled and ready to export!
            </span>
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              onClick={() => openAuth("resume", "/resume")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 sm:w-auto"
            >
              <FileText size={17} /> Build Your Resume <ArrowRight size={15} />
            </button>

            <button
              onClick={() => openAuth("interview", "/interview")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
            >
              <Mic size={17} className="text-indigo-600" /> Try Interview Lab
            </button>

            <Link
              to="/login?mode=signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Sign Up Free <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-10 lg:mt-0 lg:ml-auto lg:max-w-md">
          <div className="career-preview rounded-3xl border border-white/80 bg-white/75 p-4 shadow-2xl shadow-indigo-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-700/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                  <TrendingUp size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Career snapshot</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Your momentum, visualized</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-100/80 p-3 dark:bg-slate-800/80">
                <p className="text-[10px] font-semibold text-slate-500">Profile strength</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">84<span className="text-sm text-indigo-500">%</span></p>
                  <span className="text-[10px] font-bold text-emerald-600">+12%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full w-[84%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" /></div>
              </div>
              <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-600/20">
                <p className="text-[10px] font-semibold text-indigo-100">Match score</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-extrabold">92<span className="text-sm text-indigo-200">%</span></p>
                  <Target size={17} className="text-indigo-200" />
                </div>
                <p className="mt-2 text-[10px] font-medium text-indigo-100">Top role: Product Designer</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Application pulse</p>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">Last 7 days</span>
              </div>
              <div className="mt-3 flex h-14 items-end gap-1.5">
                {[28, 38, 31, 52, 44, 68, 82, 64, 92, 76, 100, 88].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-fuchsia-400 opacity-80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/30">
              <Award size={17} className="shrink-0 text-amber-500" />
              <p className="text-[11px] font-medium leading-snug text-amber-900 dark:text-amber-200">You’re 3 focused actions away from interview-ready.</p>
              <ArrowRight size={15} className="ml-auto shrink-0 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Feature Pill Stats */}
        <div className="feature-pill-stats relative z-10 mt-10 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-6 sm:grid-cols-4 dark:border-slate-800">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">100%</p>
            <p className="text-xs text-slate-500">ATS-Friendly Layouts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">AI-Powered</p>
            <p className="text-xs text-slate-500">Mock Audio/Text Interviews</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Instant</p>
            <p className="text-xs text-slate-500">Auto Resume Fill on Sign-up</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Free</p>
            <p className="text-xs text-slate-500">For Active Job Seekers</p>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Comprehensive Suite
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Everything you need to advance your career
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Engineered to guide you from initial resume polishing to negotiating final job offers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Resume Builder */}
          <div className="feature-card group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md transition">
            <div>
              <div className="inline-flex rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
                <FileText size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                AI Resume Builder
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose classic, modern, or minimal ATS templates. Your sign-up details populate automatically, allowing you to edit and export PDF with zero hassle.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openAuth("resume", "/resume")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400"
              >
                Launch Builder <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: Interview Lab */}
          <div className="feature-card group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md transition">
            <div>
              <div className="inline-flex rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-4">
                <Mic size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                AI Interview Lab
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Rehearse with realistic role-based interview prompts. Get instant feedback on your answers, clarity, and technical completeness.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openAuth("interview", "/interview")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 group-hover:text-purple-700 dark:text-purple-400"
              >
                Start Practice <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 3: Skill Gaps */}
          <div className="feature-card group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md transition">
            <div>
              <div className="inline-flex rounded-xl bg-teal-100 p-3 text-teal-600 dark:bg-teal-950 dark:text-teal-400 mb-4">
                <Target size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                Skill Gap Analyzer
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Benchmark your qualifications against target job descriptions to identify the exact skills recruiters look for.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openAuth("skills", "/skills")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 group-hover:text-teal-700 dark:text-teal-400"
              >
                Analyze Gaps <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 4: Application Pipeline */}
          <div className="feature-card group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md transition">
            <div>
              <div className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
                <Briefcase size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                Application Tracker
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Track every stage of your job search: Saved, Applied, Assessment, Interview, and Offer with visual status dashboards.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openAuth("applications", "/applications")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 group-hover:text-amber-700 dark:text-amber-400"
              >
                Track Pipeline <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Resume Showcase Feature */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 sm:p-10 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Zap size={13} /> Seamless Sign-Up Integration
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Sign up once. Your resume is ready instantly.
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tired of re-typing the same contact info, degrees, and skills into blank templates?
              During sign-up, we collect your essential career details and seamlessly seed your
              Resume Builder.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Full Name, Email & Phone automatically formatted in header",
                "Education, College, and Graduation Year organized in Education section",
                "Key skills and target role mapped directly to ATS-friendly keyword sections",
                "Switch effortlessly between Classic, Modern, and Minimal layouts",
                "Export clean print-ready PDFs without watermarks",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => openAuth("resume", "/resume")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
              >
                Start Building Now <ArrowRight size={15} />
              </button>
              <Link
                to="/login?mode=signup&redirect=%2Fresume"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                Sign Up with Details
              </Link>
            </div>
          </div>

          {/* Resume Visual Mockup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div className="border-b-2 border-indigo-600 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Alex Morgan</h4>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Full Stack Software Engineer
                  </p>
                </div>
                <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  ATS Verified
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                alex.morgan@example.com • +1 (555) 234-5678 • San Francisco, CA • linkedin.com/in/alexmorgan
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Skills
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  TypeScript • React • Node.js • Next.js • PostgreSQL • Docker • TailwindCSS • System Design
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Experience
                </p>
                <div className="mt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Senior Software Engineer, TechCorp</span>
                    <span className="text-slate-500 font-normal">2023 - Present</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Architected high-throughput microservices reducing latency by 42%. Mentored junior engineers and led agile delivery sprints.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Education
                </p>
                <div className="mt-1 flex justify-between text-xs font-semibold">
                  <span>B.S. in Computer Science, University of California</span>
                  <span className="text-slate-500 font-normal">Graduated 2024</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-indigo-50/70 p-2.5 text-center dark:bg-indigo-950/40">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                ✨ Ready to customize your own ATS-compatible resume?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="rounded-3xl bg-indigo-600 p-8 sm:p-12 text-center text-white shadow-xl shadow-indigo-600/20">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Take the Next Step in Your Career Today
        </h2>
        <p className="mt-3 text-base text-indigo-100 max-w-xl mx-auto">
          Join thousands of professionals who build ATS resumes, practice interviews, and secure their target roles with hireReady-AI — When Talent Meets Intelligence.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login?mode=signup&redirect=%2Fresume"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-600 shadow-md hover:bg-indigo-50 transition"
          >
            Create Free Account <ArrowRight size={15} />
          </Link>
          <Link
            to="/login?mode=login"
            className="inline-flex items-center rounded-xl border border-indigo-400 px-5 py-3.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Sign In to Existing Account
          </Link>
        </div>
      </section>

      {/* Auth Modal for Feature Gating */}
      <AuthModal
        isOpen={modalState.isOpen}
        onClose={closeAuth}
        feature={modalState.feature}
        redirectPath={modalState.redirectPath}
      />
    </div>
  );
}
