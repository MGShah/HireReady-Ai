import { useEffect, useState } from "react";
import { api, errMsg } from "../lib/api";
import { STATUSES } from "../lib/constants";
import { Sparkles, Copy, Check, X, FileText, ExternalLink } from "lucide-react";
import { loadCareerContext, subscribeToCareerContext } from "../lib/careerContext";

type App = { id: string; company: string; title: string; url?: string; status: string; notes?: string };
const field = "rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white";

export default function Applications() {
  const [apps, setApps] = useState<App[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ company: "", title: "", url: "", notes: "" });

  // AI Cover Letter Modal states
  const [activeLetter, setActiveLetter] = useState<{ company: string; title: string; letter: string } | null>(null);
  const [letterLoadingId, setLetterLoadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [candidateSkills, setCandidateSkills] = useState("");

  const load = () =>
    api
      .get("/api/applications")
      .then(({ data }) => setApps(data ?? []))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    loadCareerContext().then((context) => {
      setCandidateSkills(context.skills.join(", "));
    }).catch(() => undefined);
    return subscribeToCareerContext(() => {
      loadCareerContext()
        .then((context) => setCandidateSkills(context.skills.join(", ")))
        .catch(() => undefined);
    });
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/api/applications", {
        company: f.company,
        title: f.title,
        ...(f.url ? { url: f.url } : {}),
        ...(f.notes ? { notes: f.notes } : {}),
      });
      setF({ company: "", title: "", url: "", notes: "" });
      await load();
    } catch (e2) {
      setErr(errMsg(e2));
    }
  }

  async function move(id: string, status: string) {
    try {
      await api.patch(`/api/applications/${id}`, { status });
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/api/applications/${id}`);
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function generateCoverLetter(app: App) {
    setLetterLoadingId(app.id);
    try {
      const { data } = await api.post("/api/ai/cover-letter", {
        company: app.company,
        title: app.title,
        skills: candidateSkills,
      });
      if (data?.letter) {
        setActiveLetter({
          company: app.company,
          title: app.title,
          letter: data.letter,
        });
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLetterLoadingId(null);
    }
  }

  const handleCopy = () => {
    if (activeLetter?.letter) {
      navigator.clipboard.writeText(activeLetter.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Application Pipeline</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sparkles size={12} /> AI Outreach Ready
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Track interview pipelines, log key contacts, and generate tailored AI cover letters for each opportunity.
        </p>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={add} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <input
          required
          className={`${field} min-w-0 flex-1 sm:min-w-[10rem]`}
          placeholder="Company Name"
          value={f.company}
          onChange={(e) => setF({ ...f, company: e.target.value })}
        />
        <input
          required
          className={`${field} min-w-0 flex-1 sm:min-w-[10rem]`}
          placeholder="Job Role / Title"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <input
          className={`${field} min-w-0 flex-1 sm:min-w-[12rem]`}
          type="url"
          placeholder="Job Posting URL"
          value={f.url}
          onChange={(e) => setF({ ...f, url: e.target.value })}
        />
        <input
          className={`${field} min-w-0 flex-1 sm:min-w-[12rem]`}
          placeholder="Notes / Recruiter Name"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto sm:py-1.5">
          + Add Opportunity
        </button>
      </form>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </div>
      )}

      {/* Kanban Pipeline Board */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading your applications...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <div key={s} className="w-72 shrink-0 rounded-2xl bg-slate-100/80 p-3 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {s}
                </h2>
                <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {apps.filter((a) => a.status === s).length}
                </span>
              </div>

              <div className="space-y-3">
                {apps
                  .filter((a) => a.status === s)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-700/80 dark:bg-slate-900 space-y-2 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{a.title}</p>
                          <p className="text-[11px] font-medium text-slate-500">{a.company}</p>
                        </div>
                        {a.url && (
                          <a
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open posting"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>

                      {a.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-md">
                          {a.notes}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => generateCoverLetter(a)}
                          disabled={letterLoadingId === a.id}
                          className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          <Sparkles size={11} className={letterLoadingId === a.id ? "animate-spin text-indigo-600" : "text-indigo-600"} />
                          {letterLoadingId === a.id ? "Drafting..." : "✨ AI Cover Letter"}
                        </button>
                        <button
                          className="text-[11px] text-red-500 hover:underline"
                          onClick={() => remove(a.id)}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="pt-1">
                        <select
                          aria-label="Move to stage"
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          value={a.status}
                          onChange={(e) => move(a.id, e.target.value)}
                        >
                          {STATUSES.map((x) => (
                            <option key={x} value={x}>
                              Move to: {x}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Cover Letter Modal */}
      {activeLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Outreach & Cover Letter Draft
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tailored for {activeLetter.title} at {activeLetter.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLetter(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {activeLetter.letter}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Generated via hireReady-AI AI Engine
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? "Copied to Clipboard!" : "Copy Letter"}
                </button>
                <button
                  onClick={() => setActiveLetter(null)}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
