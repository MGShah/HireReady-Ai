import { useEffect, useMemo, useState } from "react";
import { Award, BriefcaseBusiness, CheckCircle2, GraduationCap, MapPin, Save, Sparkles, UserRound } from "lucide-react";
import { api, errMsg } from "../lib/api";
import { CAREER_FIELDS } from "../lib/constants";
import { notifyCareerContextChanged } from "../lib/careerContext";

const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

type FormState = {
  full_name: string;
  education: string;
  college: string;
  graduation_year: string;
  skills: string;
  target_role: string;
  location: string;
  daily_minutes: string;
};

const empty: FormState = {
  full_name: "", education: "", college: "", graduation_year: "", skills: "",
  target_role: "", location: "", daily_minutes: "60",
};

export default function Profile() {
  const [f, setF] = useState<FormState>(empty);
  const [customRole, setCustomRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/profile").then(({ data }) => {
      const target = data.target_role ?? "";
      setF({
        full_name: data.full_name ?? "",
        education: data.education ?? "",
        college: data.college ?? "",
        graduation_year: data.graduation_year ? String(data.graduation_year) : "",
        skills: (data.skills ?? []).join(", "),
        target_role: target,
        location: data.location ?? "",
        daily_minutes: String(data.daily_minutes ?? 60),
      });
      if (!CAREER_FIELDS.includes(target as (typeof CAREER_FIELDS)[number])) setCustomRole(target);
    }).catch((e) => setErr(errMsg(e))).finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((current) => ({ ...current, [key]: event.target.value }));
    setMsg("");
  };

  const skillCount = useMemo(() => f.skills.split(",").map((skill) => skill.trim()).filter(Boolean).length, [f.skills]);
  const completion = Math.round([
    f.full_name, f.target_role, f.location, f.education, f.college, f.graduation_year, f.skills,
  ].filter(Boolean).length / 7 * 100);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMsg(""); setErr("");
    try {
      await api.put("/api/profile", {
        full_name: f.full_name.trim(),
        education: f.education.trim(),
        college: f.college.trim(),
        target_role: f.target_role.trim(),
        location: f.location.trim(),
        ...(f.graduation_year ? { graduation_year: Number(f.graduation_year) } : {}),
        skills: f.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        daily_minutes: Number(f.daily_minutes),
      });
      notifyCareerContextChanged();
      setMsg("Profile saved and resume synced.");
    } catch (error) {
      setErr(errMsg(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-800" /><div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>;

  const initials = f.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CP";
  const isCustom = !CAREER_FIELDS.includes(f.target_role as (typeof CAREER_FIELDS)[number]);

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-5">
      <section className="professional-surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-600/20">{initials}</div>
          <div className="min-w-[14rem] flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Career profile</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{f.full_name || "Build your profile"}</h1>
            <p className="mt-1 text-sm text-slate-500">{f.target_role || "Choose the field you want to grow in"}{f.location ? ` · ${f.location}` : ""}</p>
          </div>
          <div className="w-full rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70 sm:w-48">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Profile strength</span><span>{completion}%</span></div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completion}%` }} /></div>
            <p className="mt-2 text-[10px] text-slate-500">Complete your details for better recommendations.</p>
          </div>
        </div>
      </section>

      {err && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{err}</p>}
      {msg && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">{msg}</p>}

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="professional-surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <span className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><UserRound size={18} /></span>
            <div><h2 className="font-bold">About you</h2><p className="text-xs text-slate-500">The basics used to personalize your workspace.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Full name<input className={field} value={f.full_name} onChange={set("full_name")} placeholder="Your name" /></label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Career field
              <select className={field} value={isCustom ? "Other / Custom Field" : f.target_role} onChange={(event) => {
                const value = event.target.value;
                setF((current) => ({ ...current, target_role: value === "Other / Custom Field" ? customRole : value }));
              }}>
                <option value="">Choose a field</option>
                {CAREER_FIELDS.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            {isCustom && <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Custom field<input className={field} value={customRole} onChange={(event) => { setCustomRole(event.target.value); setF((current) => ({ ...current, target_role: event.target.value })); }} placeholder="e.g. Photographer, Chef, Journalist" /></label>}
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Location<div className="relative"><MapPin size={15} className="absolute left-3 top-3.5 text-slate-400" /><input className={`${field} pl-9`} value={f.location} onChange={set("location")} placeholder="City, country" /></div></label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Daily learning time<select className={field} value={f.daily_minutes} onChange={set("daily_minutes")}>{[30, 60, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
          </div>
        </div>

        <div className="space-y-5">
          <div className="professional-surface rounded-2xl p-5">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><GraduationCap size={18} /></span><div><h2 className="font-bold">Education</h2><p className="text-xs text-slate-500">Add your latest qualification.</p></div></div>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Qualification<input className={field} value={f.education} onChange={set("education")} placeholder="e.g. Bachelor of Arts" /></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">School / college<input className={field} value={f.college} onChange={set("college")} placeholder="Institution name" /></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Graduation year<input className={field} type="number" min={1990} max={2100} value={f.graduation_year} onChange={set("graduation_year")} placeholder="2025" /></label>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-600 p-2.5 text-white"><Award size={18} /></span><div><h2 className="font-bold text-slate-900 dark:text-white">Your toolkit</h2><p className="text-xs text-slate-500">Skills power your recommendations.</p></div></div><span className="text-xl font-black text-indigo-600 dark:text-indigo-300">{skillCount}</span></div>
            <input className={`${field} mt-4`} value={f.skills} onChange={set("skills")} placeholder="Teaching, communication, planning" />
            <p className="mt-2 text-[10px] text-slate-500">Separate skills with commas.</p>
          </div>
        </div>
      </section>

      <div className="professional-surface sticky bottom-4 z-10 flex items-center justify-between rounded-2xl p-3">
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><CheckCircle2 size={15} className="text-emerald-500" /> Changes sync with your resume</div>
        <button disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60"><Save size={16} />{saving ? "Saving..." : "Save profile"}</button>
      </div>
    </form>
  );
}
