import React from "react";
import { Layout, Check, Sparkles } from "lucide-react";

export type ResumeTemplate = "modern" | "executive" | "minimal" | "academic" | "classic";

interface TemplateSelectorProps {
  currentTemplate: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
}

const TEMPLATES: {
  id: ResumeTemplate;
  name: string;
  tagline: string;
  recommendedFor: string;
}[] = [
  {
    id: "modern",
    name: "Modern Tech",
    tagline: "Bold accent header bar, crisp hierarchy & skills matrix",
    recommendedFor: "Software Engineers, Product, Data & Tech startups",
  },
  {
    id: "executive",
    name: "Executive / Corporate",
    tagline: "Centered serif elegance, refined divider rules & leadership emphasis",
    recommendedFor: "Executives, Consulting, Finance, Legal & Directors",
  },
  {
    id: "minimal",
    name: "Creative / Minimal",
    tagline: "Refined whitespace, compact typography & sleek recruiter scanability",
    recommendedFor: "Designers, Marketers, Creative roles & Modern agencies",
  },
  {
    id: "academic",
    name: "Academic / Research",
    tagline: "Formal structure, comprehensive publications, teaching & certifications",
    recommendedFor: "Researchers, Scientists, Professors & Education leads",
  },
];

export default function TemplateSelector({
  currentTemplate,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Layout size={14} className="text-indigo-600" />
          Resume Template Style
        </label>
        <span className="text-[11px] text-slate-400">All ATS compliant</span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {TEMPLATES.map((tmpl) => {
          const isSelected = currentTemplate === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/40 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/20"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {tmpl.name}
                </span>
                {isSelected && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check size={10} />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                {tmpl.tagline}
              </p>
              <span className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                Best for: {tmpl.recommendedFor}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
