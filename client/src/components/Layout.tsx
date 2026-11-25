import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import type { Session } from "../lib/auth";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Home,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  Mic,
  Moon,
  Sun,
  Target,
  User,
  X,
  Lock,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { auth } from "../lib/auth";
import { api } from "../lib/api";

interface LayoutProps {
  session?: Session | null;
}

export default function Layout({ session }: LayoutProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [announcement, setAnnouncement] = useState<{ active: boolean; text: string; type: string } | null>(null);
  const [dismissedText, setDismissedText] = useState("");
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("theme");
      return s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    } else {
      alert("To install hireReady-AI on mobile, open your browser menu and tap 'Add to Home Screen' or 'Install App'.");
    }
  };


  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }, [dark]);

  useEffect(() => {
    let mounted = true;

    const fetchAnnouncement = () => {
      api
        .get("/api/announcement")
        .then((res) => {
          if (!mounted) return;
          if (res.data && res.data.active && res.data.text) {
            setAnnouncement(res.data);
          } else {
            setAnnouncement(null);
          }
        })
        .catch(() => {});
    };

    fetchAnnouncement();

    const handleCustomUpdate = (e: any) => {
      if (e.detail?.active && e.detail?.text) {
        setAnnouncement(e.detail);
        setDismissedText("");
      } else {
        setAnnouncement(null);
      }
    };
    window.addEventListener("nexa_announcement_updated", handleCustomUpdate);

    const interval = setInterval(fetchAnnouncement, 8_000);

    return () => {
      mounted = false;
      window.removeEventListener("nexa_announcement_updated", handleCustomUpdate);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const isUserAdmin =
    session?.user?.role === "admin" ||
    session?.user?.email === "mahekgshah@gmail.com" ||
    session?.user?.email === "admin@careerpilot.com";

  const navItems = [
    {
      to: "/",
      label: session ? "Dashboard" : "Home",
      icon: session ? LayoutDashboard : Home,
      end: true,
      isProtected: false,
    },
    { to: "/resume", label: "Resume Builder", icon: FileText, end: false, isProtected: true },
    { to: "/interview", label: "Interview Lab", icon: Mic, end: false, isProtected: true },
    { to: "/skills", label: "Skill Gaps", icon: Target, end: false, isProtected: true },
    { to: "/applications", label: "Applications", icon: Briefcase, end: false, isProtected: true },
    { to: "/profile", label: "Profile", icon: User, end: false, isProtected: true },
    ...(isUserAdmin
      ? [
          {
            to: "/admin",
            label: "Admin Portal",
            icon: ShieldCheck,
            end: false,
            isProtected: true,
            badge: "ADMIN",
          },
        ]
      : []),
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon, end, isProtected, ...item }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
            }`
          }
        >
          <div className="flex items-center gap-2.5">
            <Icon size={16} />
            <span>{label}</span>
          </div>
          {(item as any).badge ? (
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 ring-1 ring-indigo-500/30 uppercase">
              {(item as any).badge}
            </span>
          ) : !session && isProtected ? (
            <span className="flex items-center gap-1 rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Lock size={10} />
            </span>
          ) : null}
        </NavLink>
      ))}

      {/* Guest Sign In Prompt Card in Sidebar */}
      {!session && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles size={13} />
            <span>Direct Resume Seeding</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
            Sign up once and your details directly populate your ATS resume!
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              to="/login?mode=signup&redirect=%2Fresume"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <UserPlus size={13} /> Create Account
            </Link>
            <Link
              to="/login?mode=login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <LogIn size={13} /> Log In
            </Link>
          </div>
        </div>
      )}

      {/* Bottom utility controls */}
      <div className="mt-auto space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleInstall}
          className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:from-indigo-100 hover:to-violet-100 dark:border-indigo-900/60 dark:from-indigo-950/60 dark:to-violet-950/40 dark:text-indigo-300 transition shadow-xs"
          title="Install hireReady-AI as an application on your device"
        >
          <div className="flex items-center gap-2">
            <Smartphone size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Install hireReady-AI App</span>
          </div>
          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">PWA</span>
        </button>

        <button
          onClick={() => setDark(!dark)}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}{" "}
          {dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>

        {session ? (
          <button
            onClick={() => auth.signOut()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
          >
            <LogOut size={15} /> Log Out
          </button>
        ) : (
          <Link
            to="/login?mode=login"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition"
          >
            <LogIn size={15} /> Sign In
          </Link>
        )}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="professional-surface hidden w-60 shrink-0 flex-col rounded-none border-y-0 border-l-0 border-r border-slate-200/80 dark:border-slate-800 md:flex">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} />
            <div className="flex flex-col">
              <span className="leading-tight">hireReady-AI</span>
              <span className="text-[9px] font-normal tracking-wide text-slate-400 dark:text-slate-500">Talent × Intelligence</span>
            </div>
          </Link>
        </div>
        {nav}
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <aside className="professional-surface flex w-64 flex-col rounded-none border-y-0 border-l-0 border-r border-slate-200 shadow-2xl dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">hireReady-AI</span>
                <span className="text-[9px] text-slate-400">When Talent meets intelligence</span>
              </div>
              <button
                aria-label="Close menu"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            {nav}
          </aside>
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xs" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="professional-surface flex items-center justify-between rounded-none border-x-0 border-t-0 border-b border-slate-200 p-3 dark:border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={16} />
              <span>hireReady-AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isUserAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 rounded-lg bg-indigo-600/10 px-2 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-500/30"
                title="Open Admin Portal"
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </Link>
            )}

            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {!session ? (
              <Link
                to="/login?mode=signup"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Sign Up
              </Link>
            ) : (
              <button
                onClick={() => auth.signOut()}
                aria-label="Sign out"
                className="rounded-lg p-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>

        {/* Content Outlet with responsive padding */}
        <main className="mx-auto max-w-7xl p-3 sm:p-5 md:p-8 flex-1 w-full pb-20 md:pb-8">
          {announcement?.active && announcement?.text && dismissedText !== announcement.text && (
            <div
              className={`mb-5 flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
                announcement.type === "alert"
                  ? "border border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200"
                  : announcement.type === "warning"
                  ? "border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200"
                  : announcement.type === "success"
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200"
                  : "border border-indigo-200 bg-indigo-50/90 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 shadow-xs">
                  <Bell size={15} className="text-indigo-600 dark:text-indigo-400" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 block">
                    Platform Broadcast Announcement
                  </span>
                  <span className="text-sm font-bold">{announcement.text}</span>
                </div>
              </div>
              <button
                onClick={() => setDismissedText(announcement.text)}
                className="ml-3 rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition"
                title="Dismiss Announcement"
              >
                ✕
              </button>
            </div>
          )}
          <Outlet />
        </main>

        {/* Mobile App Bottom Navigation Bar (<md screens) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden shadow-lg">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`
            }
          >
            {session ? <LayoutDashboard size={18} /> : <Home size={18} />}
            <span>{session ? "Dashboard" : "Home"}</span>
          </NavLink>

          <NavLink
            to="/resume"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`
            }
          >
            <FileText size={18} />
            <span>Resume</span>
          </NavLink>

          <NavLink
            to="/interview"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`
            }
          >
            <Mic size={18} />
            <span>Interview</span>
          </NavLink>

          <NavLink
            to="/skills"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`
            }
          >
            <Target size={18} />
            <span>Skills</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`
            }
          >
            <User size={18} />
            <span>Profile</span>
          </NavLink>

          {isUserAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                  isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-purple-600 hover:text-purple-700 dark:text-purple-400"
                }`
              }
            >
              <ShieldCheck size={18} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}
