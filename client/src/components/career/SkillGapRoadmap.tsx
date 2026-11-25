import React from "react";
import { Compass, BookOpen, CheckSquare, ExternalLink, ArrowRight, Lightbulb } from "lucide-react";

interface ImprovementStep {
  phase: string;
  topic: string;
  actions: string[];
  resources: string[];
}

interface RecommendedRole {
  role: string;
  explanation: string;
  matchScore: number;
}

interface SkillGapRoadmapProps {
  improvementPlan: ImprovementStep[];
  recommendedRoles: RecommendedRole[];
  careerAdvice: string;
  onSelectRole?: (role: string) => void;
}

export default function SkillGapRoadmap({
  improvementPlan,
  recommendedRoles,
  careerAdvice,
  onSelectRole,
}: SkillGapRoadmapProps) {
  return (
    <div className="space-y-6">
      {/* 1. Career Advice Card */}
      {careerAdvice && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/30 dark:to-purple-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <Lightbulb size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                Strategic Career Advisory
              </h4>
              <p className="mt-1 text-xs text-indigo-900/90 dark:text-indigo-300/90 leading-relaxed">
                {careerAdvice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step-by-Step Learning Roadmap */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Targeted Skill Bridging Roadmap
            </h4>
            <p className="text-xs text-slate-500">
              Structured step-by-step phases to bridge priority skill prerequisites with evidence.
            </p>
          </div>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:bottom-3 before:top-3 before:left-2.5 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
          {improvementPlan.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[27px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {idx + 1}
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {step.phase}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Topic: {step.topic}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CheckSquare size={12} /> Concrete Milestones
                  </span>
                  {step.actions.map((action, aIdx) => (
                    <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>

                {/* Resources */}
                {step.resources && step.resources.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen size={12} /> Curated Learning Resources
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {step.resources.map((res, rIdx) => (
                        <span
                          key={rIdx}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recommended Alternative Roles */}
      {recommendedRoles.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Alternative & Adjacent High-Fit Roles
            </h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {recommendedRoles.map((roleObj, idx) => (
              <div
                key={idx}
                onClick={() => onSelectRole && onSelectRole(roleObj.role)}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-400 hover:shadow-md transition cursor-pointer dark:border-slate-800 dark:hover:border-indigo-600"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {roleObj.role}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {roleObj.matchScore}% Fit
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-3">
                    {roleObj.explanation}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Evaluate this role</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
