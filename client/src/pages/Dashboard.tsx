import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Mic,
  Target,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { auth } from "../lib/auth";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, errMsg } from "../lib/api";
import AiAssistant from "../components/AiAssistant";
import { STATUSES } from "../lib/constants";
import { loadCareerContext, subscribeToCareerContext } from "../lib/careerContext";

type Data = { p: any; i: any[]; s: any[]; a: any[] };

const panel =
  "professional-surface rounded-2xl p-5";
const dateLabel = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Recently";

function Stat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <div className="professional-surface rounded-2xl p-4">
      <div className="flex justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon size={17} className="text-indigo-600" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
function Action({
  to,
  title,
  detail,
  icon: Icon,
}: {
  to: string;
  title: string;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-950"
    >
      <span className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{title}</strong>
        <span className="block truncate text-xs text-slate-500">{detail}</span>
      </span>
      <ArrowRight size={15} className="text-slate-400" />
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    auth.getUser().then(({ data: u }) => {
      if (
        u.user?.role === "admin" ||
        u.user?.email === "mahekgshah@gmail.com" ||
        u.user?.email === "admin@careerpilot.com"
      ) {
        setIsAdmin(true);
      }
    });

    Promise.allSettled([
      loadCareerContext(),
      api.get("/api/interviews"),
      api.get("/api/skill-analyses"),
      api.get("/api/applications"),
    ]).then(([contextResult, interviewsResult, skillsResult, applicationsResult]) => {
      const context =
        contextResult.status === "fulfilled"
          ? contextResult.value
          : { profile: {}, targetRole: "", skills: [] };
      const interviews =
        interviewsResult.status === "fulfilled" ? interviewsResult.value.data ?? [] : [];
      const skills =
        skillsResult.status === "fulfilled" ? skillsResult.value.data ?? [] : [];
      const applications =
        applicationsResult.status === "fulfilled" ? applicationsResult.value.data ?? [] : [];
      const failedRequests = [
        contextResult,
        interviewsResult,
        skillsResult,
        applicationsResult,
      ].filter((result) => result.status === "rejected");

      setData({
        p: {
          ...context.profile,
          target_role: context.targetRole,
          skills: context.skills,
        },
        i: interviews,
        s: skills,
        a: applications,
      });

      if (failedRequests.length) {
        setWarning(
          "Some workspace data could not be loaded. You can continue using the available tools and refresh to retry.",
        );
      }
    }).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(
    () =>
      subscribeToCareerContext(() => {
        loadCareerContext()
          .then((context) => {
            setData((current) =>
              current
                ? {
                    ...current,
                    p: {
                      ...context.profile,
                      target_role: context.targetRole,
                      skills: context.skills,
                    },
                  }
                : current,
            );
          })
          .catch(() => undefined);
      }),
    [],
  );
  if (error)
    return (
      <section className={`${panel} mx-auto max-w-xl`}>
        <h1 className="text-lg font-semibold">Dashboard unavailable</h1>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
        <Link
          className="mt-4 inline-flex rounded bg-indigo-600 px-3 py-2 text-sm text-white"
          to="/profile"
        >
          Open profile
        </Link>
      </section>
    );
  if (!data) return <p>Loading your career workspace...</p>;

  const fields = [
    data.p?.full_name,
    data.p?.education,
    data.p?.college,
    data.p?.graduation_year,
    data.p?.target_role,
    data.p?.location,
    data.p?.skills?.length,
  ];
  const completion = Math.round(
    (fields.filter(Boolean).length / fields.length) * 100,
  );
  const activeApps = data.a.filter(
    (item) => !["rejected", "withdrawn", "offer"].includes(item.status),
  ).length;
  const chart = STATUSES.map((status) => ({
    status,
    count: data.a.filter((item) => item.status === status).length,
  }));
  const todos: { title: string; detail: string; to: string }[] = [];
  if (completion < 100)
    todos.push({
      title: "Complete your profile",
      detail: `${completion}% ready for personalized guidance`,
      to: "/profile",
    });
  if (!data.a.length)
    todos.push({
      title: "Track your first application",
      detail: "Keep your job search organized",
      to: "/applications",
    });
  if (!data.i.length)
    todos.push({
      title: "Practice an interview",
      detail: "Get realistic role-based feedback",
      to: "/interview",
    });
  if (!data.s.length)
    todos.push({
      title: "Run a skill-gap analysis",
      detail: "Find the best next skills to develop",
      to: "/skills",
    });
  const next = todos[0] ?? {
    title: "Keep your momentum going",
    detail: "Review your pipeline and practice again",
    to: "/applications",
  };
  const activity = [
    ...data.a.map((item) => ({
      title: item.title || "Application updated",
      detail: `${item.company || "Company"} · ${item.status || "saved"}`,
      date: item.updated_at || item.created_at,
      to: "/applications",
    })),
    ...data.i.map((item) => ({
      title: `${item.role || "Interview"} practice`,
      detail: `${item.status || "active"} session`,
      date: item.created_at,
      to: "/interview",
    })),
    ...data.s.map((item) => ({
      title: `${item.target_role || "Skill"} analysis`,
      detail: item.demo ? "Demo analysis" : "Analysis completed",
      date: item.created_at,
      to: "/skills",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {warning && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <span>{warning}</span>
          <button
            type="button"
            className="shrink-0 font-semibold underline underline-offset-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white shadow-lg dark:border-indigo-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Administrator Control Center</span>
                <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 ring-1 ring-indigo-400/30 uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                You are authenticated as an administrator. Manage users, applications, and AI telemetry in the portal.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition shrink-0"
          >
            Launch Admin Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Career workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Welcome
            {data.p?.full_name
              ? `, ${data.p.full_name.split(" ")[0]}`
              : " back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your next best career step is ready.
          </p>
        </div>
        <Link
          to="/resume"
          className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white"
        >
          <FileText size={16} /> Build resume
        </Link>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Profile readiness"
          value={`${completion}%`}
          detail="Complete your profile"
          icon={CheckCircle2}
        />
        <Stat
          label="Active applications"
          value={activeApps}
          detail={`${data.a.length} total tracked`}
          icon={BriefcaseBusiness}
        />
        <Stat
          label="Interview practice"
          value={data.i.length}
          detail="Sessions completed or active"
          icon={Mic}
        />
        <Stat
          label="Skill analyses"
          value={data.s.length}
          detail="Role comparisons saved"
          icon={Target}
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div
          className={`${panel} border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/40`}
        >
          <div className="flex gap-3">
            <span className="rounded-lg bg-indigo-600 p-2 text-white">
              <TrendingUp size={19} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                Recommended next step
              </p>
              <h2 className="mt-1 text-xl font-semibold">{next.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {next.detail}
              </p>
              <Link
                to={next.to}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300"
              >
                Continue <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
        <div className={panel}>
          <h2 className="font-medium">Profile readiness</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{completion}% complete</span>
            <Link className="text-indigo-600" to="/profile">
              Update profile
            </Link>
          </div>
        </div>
      </section>
      <AiAssistant />
      <section>
        <h2 className="text-lg font-semibold">Move your career forward</h2>
        <p className="mb-3 text-sm text-slate-500">
          Intelligent career progression and application tools.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Action
            to="/resume"
            title="Resume Studio"
            detail="Upload, tailor & export A4 PDF"
            icon={FileText}
          />
          <Action
            to="/skills"
            title="Domain Fit Analyzer"
            detail="Multi-factor fit & learning roadmap"
            icon={Target}
          />
          <Action
            to="/applications"
            title="Track applications"
            detail="Organize your pipeline"
            icon={BriefcaseBusiness}
          />
          <Action
            to="/interview"
            title="Practice interview"
            detail="Build role-specific confidence"
            icon={Mic}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className={panel}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Application pipeline</h2>
              <p className="text-xs text-slate-500">
                Opportunities by current stage
              </p>
            </div>
            <Link className="text-sm text-indigo-600" to="/applications">
              View all
            </Link>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={panel}>
          <h2 className="font-medium">Recent activity</h2>
          {activity.length ? (
            <div className="mt-2">
              {activity.map((item, index) => (
                <Link
                  to={item.to}
                  key={`${item.title}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">
                      {item.title}
                    </strong>
                    <span className="block truncate text-xs text-slate-500">
                      {item.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {dateLabel(item.date)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Your activity will appear here as you use hireReady-AI.
            </p>
          )}
        </div>
      </section>
      <section className={panel}>
        <h2 className="font-medium">Next milestones</h2>
        {todos.length ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {todos.map((todo) => (
              <Link
                key={todo.to}
                to={todo.to}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm hover:border-indigo-400 dark:border-slate-700"
              >
                <span>{todo.title}</span>
                <ArrowRight size={15} className="text-slate-400" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            You are on track. Keep applying and practicing.
          </p>
        )}
      </section>
    </div>
  );
}
