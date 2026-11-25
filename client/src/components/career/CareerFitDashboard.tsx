import React, { useState, useEffect } from "react";
import { Sparkles, Target, Building, Compass, History, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { api, errMsg } from "../../lib/api";
import FitScoreCard from "./FitScoreCard";
import SkillMatchList from "./SkillMatchList";
import SkillGapRoadmap from "./SkillGapRoadmap";
import { loadCareerContext, subscribeToCareerContext } from "../../lib/careerContext";

interface CareerFitDashboardProps {
  initialRole?: string;
  onNavigateToTailoring?: (targetRole: string, company: string, jd: string) => void;
}

export default function CareerFitDashboard({
  initialRole = "Full Stack Engineer",
  onNavigateToTailoring,
}: CareerFitDashboardProps) {
  const [targetRole, setTargetRole] = useState(initialRole);
  const [targetCompany, setTargetCompany] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [jobDescription, setJobDescription] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = () => {
    api
      .get("/api/career/history")
      .then((res) => setHistory(res.data || []))
      .catch(() => undefined);
  };

  useEffect(() => {
    loadHistory();
    loadCareerContext()
      .then((context) => {
        if (context.targetRole) setTargetRole(context.targetRole);
        const role = context.targetRole.toLowerCase();
        if (/\bteach|educat|school|classroom|b\.?ed\b/.test(role)) {
          setIndustry("Education");
        } else if (/\bhealth|nurs|clinic|medical\b/.test(role)) {
          setIndustry("Healthcare");
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(
    () =>
      subscribeToCareerContext(() => {
        loadCareerContext()
          .then((context) => {
            if (context.targetRole) {
              setTargetRole(context.targetRole);
              setEvaluation(null);
              setError(null);
            }
          })
          .catch(() => undefined);
      }),
    [],
  );

  const handleEvaluate = async () => {
    if (!targetRole.trim()) {
      setError("Please specify a target role.");
      return;
    }

    setEvaluating(true);
    setError(null);
    try {
      const context = await loadCareerContext();
      const res = await api.post("/api/career/evaluate-fit", {
        target_role: targetRole,
        target_company: targetCompany,
        industry,
        job_description: jobDescription,
        candidate_profile: {
          full_name: context.profile.full_name ?? "",
          summary: context.resume.summary ?? context.profile.summary ?? "",
          skills: context.skills,
          experience: (context.resume.experience ?? []).map((item) => ({
            company: item.company ?? "",
            role: item.role ?? "",
            details: item.details ?? "",
          })),
          education: (context.resume.education ?? []).map((item) => ({
            institution: item.school ?? "",
            degree: item.degree ?? "",
            graduation_year: item.dates ?? "",
          })),
          domain_specializations: [],
        },
      });

      if (res.data?.success) {
        setEvaluation(res.data);
        loadHistory();
      } else {
        throw new Error(res.data?.error || "Failed to evaluate career fit.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setEvaluating(false);
    }
  };

  const handleLoadHistoryItem = async (id: string) => {
    setEvaluating(true);
    try {
      const res = await api.get(`/api/career/${id}`);
      if (res.data) {
        setTargetRole(res.data.target_role);
        setTargetCompany(res.data.company || "");
        setJobDescription(res.data.job_description || "");
        setEvaluation({
          fitScore: res.data.fit_score,
          fitCategory: res.data.fit_category,
          scoreBreakdown: res.data.score_breakdown,
          matchedSkills: res.data.matched_skills || [],
          transferableSkills: (res.data.transferable_skills || []).map((t: any) => ({
            skill: t.skill,
            relevance: t.relevance,
            transferContext: t.transfer_context || t.transferContext,
          })),
          missingSkills: res.data.missing_skills || [],
          experienceAlignment: res.data.experience_alignment,
          strengths: res.data.strengths || [],
          improvementPlan: res.data.improvement_plan || [],
          recommendedRoles: res.data.recommended_roles || [],
          careerAdvice: res.data.career_advice,
          confidence: res.data.confidence,
          disclaimer:
            "Evaluated using transparent multi-factor scoring (skills 45%, experience 35%, domain alignment 20%).",
        });
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Domain Fit Analysis & Career Guidance
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sparkles size={12} /> AI Intelligence
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Transparent multi-factor alignment engine measuring skill prerequisites, experience chronology, and transferable strengths against actual job specifications.
        </p>
      </div>

      {/* Target Role & Evaluation Inputs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Job Title *
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
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
              placeholder="e.g. Stripe, Netflix, Amazon"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Industry Domain
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Technology, Fintech, Healthcare"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Job Description (Optional, Paste to enable deep semantic alignment)
          </label>
          <textarea
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste role responsibilities, required qualifications, and tech stack here..."
            className="w-full rounded-xl border border-slate-300 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto">
              <span className="font-semibold shrink-0">Recent evaluations:</span>
              {history.slice(0, 3).map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleLoadHistoryItem(h.id)}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  {h.target_role} ({h.fit_score}%)
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {evaluating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Evaluating Fit...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Evaluate Domain Fit
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30">
            {error}
          </div>
        )}
      </div>

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-6">
          {/* Action banner to tailor resume */}
          {onNavigateToTailoring && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
              <div>
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Ready to optimize your application for this role?
                </p>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                  Tailor your resume bullets, summary, and action verbs directly for {targetRole}.
                </p>
              </div>
              <button
                onClick={() =>
                  onNavigateToTailoring(targetRole, targetCompany, jobDescription)
                }
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <span>Tailor My Resume</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          <FitScoreCard
            fitScore={evaluation.fitScore}
            fitCategory={evaluation.fitCategory}
            scoreBreakdown={evaluation.scoreBreakdown}
            confidence={evaluation.confidence}
            disclaimer={evaluation.disclaimer}
          />

          <SkillMatchList
            matchedSkills={evaluation.matchedSkills}
            transferableSkills={evaluation.transferableSkills}
            missingSkills={evaluation.missingSkills}
          />

          <SkillGapRoadmap
            improvementPlan={evaluation.improvementPlan}
            recommendedRoles={evaluation.recommendedRoles}
            careerAdvice={evaluation.careerAdvice}
            onSelectRole={(r) => {
              setTargetRole(r);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
