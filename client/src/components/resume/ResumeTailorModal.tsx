import React, { useState } from "react";
import { Sparkles, X, Building, Check, Loader2, ArrowRight, ShieldCheck, FileCheck } from "lucide-react";
import { api, errMsg } from "../../lib/api";

interface ResumeTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: any;
  onTailoredApplied: (tailoredContent: any, checklist: any) => void;
}

export default function ResumeTailorModal({
  isOpen,
  onClose,
  currentContent,
  onTailoredApplied,
}: ResumeTailorModalProps) {
  const [targetJobTitle, setTargetJobTitle] = useState(currentContent.headline || "");
  const [targetCompany, setTargetCompany] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [companyStyle, setCompanyStyle] = useState<"big_tech" | "enterprise" | "startup" | "academic">("big_tech");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tailored Result State
  const [tailoredResult, setTailoredResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!targetJobTitle.trim()) {
      setError("Please provide a target job title.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/resume/generate-tailored", {
        target_job_title: targetJobTitle,
        target_company: targetCompany,
        industry,
        company_style: companyStyle,
        job_description: jobDescription,
        current_content: currentContent,
      });

      if (res.data?.success) {
        setTailoredResult(res.data);
      } else {
        throw new Error(res.data?.message || "Failed to generate tailored resume.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (tailoredResult) {
      onTailoredApplied(tailoredResult.tailoredContent, tailoredResult.atsChecklist);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Resume Tailoring Engine
              </h3>
              <p className="text-xs text-slate-500">
                Align achievements, verbs, and keywords for specific companies and hiring philosophies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!tailoredResult ? (
            <>
              {/* Target Job & Company */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Job Title *
                  </label>
                  <input
                    type="text"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, McKinsey"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Company Style Profiles */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Tailoring Profile & Evaluation Philosophy
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      id: "big_tech",
                      title: "Big Tech / Product",
                      desc: "XYZ impact formula, engineering depth, metrics & concise action verbs",
                    },
                    {
                      id: "enterprise",
                      title: "Enterprise / Consulting",
                      desc: "Leadership chronology, stakeholders, governance & business impact",
                    },
                    {
                      id: "startup",
                      title: "Fast-Paced Startup",
                      desc: "Full product ownership, rapid execution velocity & shipping proof",
                    },
                    {
                      id: "academic",
                      title: "Academic / Research",
                      desc: "Formal scholarship, teaching, research methodologies & publications",
                    },
                  ].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setCompanyStyle(style.id as any)}
                      className={`rounded-xl border p-3 cursor-pointer transition ${
                        companyStyle === style.id
                          ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {style.title}
                        </span>
                        {companyStyle === style.id && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{style.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Description Paste */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Job Description / Role Requirements (Optional, Recommended)
                </label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description here to optimize ATS keywords and alignment..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Tailored Review & Compare Screen */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Tailoring Generated: {tailoredResult.versionName}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                    {tailoredResult.atsChecklist?.overall_readiness || "Good"} Readiness
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                  {tailoredResult.styleRationale}
                </p>
              </div>

              {/* Summary Comparison */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tailored Professional Summary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg leading-relaxed">
                  {tailoredResult.tailoredContent?.summary}
                </p>
              </div>

              {/* Sample Experience Bullets */}
              {tailoredResult.tailoredContent?.experience?.[0] && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tailored Experience: {tailoredResult.tailoredContent.experience[0].role}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                    {tailoredResult.tailoredContent.experience[0].details}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={tailoredResult ? () => setTailoredResult(null) : onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            {tailoredResult ? "Reconfigure Inputs" : "Cancel"}
          </button>

          {!tailoredResult ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Tailored Version
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Check size={14} />
              Apply to Active Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
