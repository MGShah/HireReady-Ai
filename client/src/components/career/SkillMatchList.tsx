import React from "react";
import { CheckCircle2, ArrowRightLeft, AlertCircle, Sparkles } from "lucide-react";

interface TransferableSkill {
  skill: string;
  relevance: string;
  transferContext: string;
}

interface MissingSkill {
  skill: string;
  priority: "critical" | "recommended" | "nice-to-have";
  reason: string;
}

interface SkillMatchListProps {
  matchedSkills: string[];
  transferableSkills: TransferableSkill[];
  missingSkills: MissingSkill[];
}

export default function SkillMatchList({
  matchedSkills,
  transferableSkills,
  missingSkills,
}: SkillMatchListProps) {
  const getPriorityBadge = (priority: MissingSkill["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900";
      case "recommended":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Matched Skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Directly Matched Skills ({matchedSkills.length})
            </h4>
            <p className="text-xs text-slate-500">
              Verified capabilities directly aligned with target role specifications.
            </p>
          </div>
        </div>

        {matchedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No direct keyword matches found.</p>
        )}
      </div>

      {/* 2. Transferable Skills */}
      {transferableSkills.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                High-Value Transferable Strengths ({transferableSkills.length})
              </h4>
              <p className="text-xs text-slate-500">
                Skills from your background that adapt directly into this target position.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {transferableSkills.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    {t.skill}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    {t.relevance}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-indigo-800/80 dark:text-indigo-300/80">
                  {t.transferContext}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Missing / Prerequisite Skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertCircle size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Recommended Prerequisite Skills ({missingSkills.length})
            </h4>
            <p className="text-xs text-slate-500">
              Missing evidence does not mean you cannot perform; these are typical role prerequisites.
            </p>
          </div>
        </div>

        {missingSkills.length > 0 ? (
          <div className="space-y-2.5">
            {missingSkills.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {m.skill}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {m.reason}
                  </p>
                </div>
                <span
                  className={`self-start sm:self-auto uppercase tracking-wide rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getPriorityBadge(
                    m.priority
                  )}`}
                >
                  {m.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Outstanding! All core prerequisites are matched by your profile.
          </p>
        )}
      </div>
    </div>
  );
}
