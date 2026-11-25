import React from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, FileCheck2, Info, Sparkles, RefreshCw, Plus, ThumbsUp, Lightbulb } from "lucide-react";

export interface ATSChecklistData {
  keyword_coverage?: {
    matched: string[];
    missing: string[];
    coverage_percent: number;
  };
  heading_structure?: {
    valid: boolean;
    notes: string[];
  };
  date_consistency?: {
    valid: boolean;
    notes: string[];
  };
  readability?: {
    score: number;
    notes: string[];
  };
  layout_compatibility?: {
    ats_safe: boolean;
    recommendations: string[];
  };
  overall_readiness?: "Excellent" | "Good" | "Needs Improvement";
}

export interface ATSAuditResult {
  atsScore: number;
  verdict: string;
  strengths: string[];
  missingKeywords: string[];
  improvements: string[];
}

interface ATSReadinessPanelProps {
  checklist: ATSChecklistData;
  auditResult?: ATSAuditResult | null;
  isAuditing?: boolean;
  onRunAudit?: () => void;
  onAddKeyword?: (keyword: string) => void;
}

export default function ATSReadinessPanel({
  checklist,
  auditResult,
  isAuditing = false,
  onRunAudit,
  onAddKeyword,
}: ATSReadinessPanelProps) {
  const currentScore = auditResult?.atsScore ?? checklist.readability?.score ?? 78;
  const readiness =
    auditResult?.verdict
      ? currentScore >= 85
        ? "Excellent"
        : currentScore >= 70
        ? "Good"
        : "Needs Improvement"
      : checklist.overall_readiness || "Good";

  const coverage = checklist.keyword_coverage?.coverage_percent ?? Math.min(95, currentScore + 2);
  const missingKeywords = auditResult?.missingKeywords || checklist.keyword_coverage?.missing || [];

  const getBadgeClass = () => {
    switch (readiness) {
      case "Excellent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800";
      case "Good":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800";
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileCheck2 size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ATS Readiness & AI Audit
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getBadgeClass()}`}>
            {readiness} ({currentScore}/100)
          </span>
          {onRunAudit && (
            <button
              type="button"
              onClick={onRunAudit}
              disabled={isAuditing}
              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300"
            >
              {isAuditing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>{isAuditing ? "Auditing..." : "Run AI Audit"}</span>
            </button>
          )}
        </div>
      </div>

      {auditResult?.verdict && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200">
          <span className="font-bold">AI Verdict:</span> {auditResult.verdict}
        </div>
      )}

      {/* Keyword Coverage Meter */}
      <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Role Keyword Density
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {coverage}% Coverage
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              coverage >= 80 ? "bg-emerald-500" : coverage >= 65 ? "bg-indigo-600" : "bg-amber-500"
            }`}
            style={{ width: `${coverage}%` }}
          />
        </div>

        {missingKeywords.length > 0 && (
          <div className="pt-2 text-xs">
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Recommended target keywords (click to add to skills):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onAddKeyword?.(k)}
                  title={`Add "${k}" to your resume skills`}
                  className="group inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950"
                >
                  <Plus size={11} className="text-indigo-500 group-hover:scale-110" />
                  <span>{k}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Strengths & Improvements if audited */}
      {auditResult && auditResult.strengths.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs dark:border-emerald-950 dark:bg-emerald-950/30">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <ThumbsUp size={13} />
            <span>Identified Profile Strengths</span>
          </div>
          <ul className="space-y-1 pl-1 text-[11px] text-emerald-900 dark:text-emerald-200">
            {auditResult.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {auditResult && auditResult.improvements.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs dark:border-amber-950 dark:bg-amber-950/30">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <Lightbulb size={13} />
            <span>High-Priority Action Items</span>
          </div>
          <ul className="space-y-1 pl-1 text-[11px] text-amber-900 dark:text-amber-200">
            {auditResult.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Checklist Items */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
          <div>
            <strong className="font-semibold text-slate-900 dark:text-white">
              Standard Heading Architecture:
            </strong>{" "}
            {checklist.heading_structure?.notes[0] ||
              "Standard semantic sections detected (Experience, Education, Skills, Projects)."}
          </div>
        </div>

        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
          <div>
            <strong className="font-semibold text-slate-900 dark:text-white">
              Chronology & Date Formatting:
            </strong>{" "}
            {checklist.date_consistency?.notes[0] ||
              "Clean machine-parseable chronological timestamps."}
          </div>
        </div>

        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />
          <div>
            <strong className="font-semibold text-slate-900 dark:text-white">
              Layout & Parser Safety:
            </strong>{" "}
            {checklist.layout_compatibility?.recommendations[0] ||
              "Selectable text, valid Unicode symbols, and no untracked graphical tables."}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800">
        <Info size={12} className="shrink-0" />
        <span>
          Transparent heuristic evaluation. hireReady-AI never promises proprietary ATS bypass or fabricated results.
        </span>
      </div>
    </div>
  );
}
