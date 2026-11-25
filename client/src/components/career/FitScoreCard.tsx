import React from "react";
import { Award, CheckCircle, AlertCircle, HelpCircle, ShieldCheck } from "lucide-react";

interface FitScoreCardProps {
  fitScore: number;
  fitCategory: "Strong Fit" | "Moderate Fit" | "Partial Fit" | "Significant Gap";
  scoreBreakdown: {
    skillScore: number;
    experienceScore: number;
    domainScore: number;
    weights: {
      skills: number;
      experience: number;
      domain: number;
    };
  };
  confidence: "high" | "medium" | "low";
  disclaimer: string;
}

export default function FitScoreCard({
  fitScore,
  fitCategory,
  scoreBreakdown,
  confidence,
  disclaimer,
}: FitScoreCardProps) {
  const getCategoryColor = () => {
    switch (fitCategory) {
      case "Strong Fit":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "Moderate Fit":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
      case "Partial Fit":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    }
  };

  const getScoreColor = () => {
    if (fitScore >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (fitScore >= 60) return "text-indigo-600 dark:text-indigo-400";
    if (fitScore >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Role Alignment Evaluation
          </span>
          <div className="mt-1 flex items-center gap-3">
            <span className={`text-4xl font-extrabold ${getScoreColor()}`}>
              {fitScore}
              <span className="text-lg font-medium text-slate-400">/100</span>
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${getCategoryColor()}`}
            >
              {fitCategory}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>
            Confidence:{" "}
            <strong className="capitalize font-semibold text-slate-900 dark:text-white">
              {confidence}
            </strong>
          </span>
        </div>
      </div>

      {/* Transparent Multi-Factor Breakdown */}
      <div className="mt-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Multi-Factor Transparent Breakdown
        </h4>

        <div className="space-y-3">
          {/* Skills Breakdown */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Skills Competency Match (45% weight)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {scoreBreakdown.skillScore}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${scoreBreakdown.skillScore}%` }}
              />
            </div>
          </div>

          {/* Experience Breakdown */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Experience & Responsibility Depth (35% weight)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {scoreBreakdown.experienceScore}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${scoreBreakdown.experienceScore}%` }}
              />
            </div>
          </div>

          {/* Domain Breakdown */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Industry & Domain Specialization (20% weight)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {scoreBreakdown.domainScore}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${scoreBreakdown.domainScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {disclaimer && (
        <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
