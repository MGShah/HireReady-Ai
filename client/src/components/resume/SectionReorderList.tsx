import React from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, Layers } from "lucide-react";

export type ResumeSectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "custom";

interface SectionReorderListProps {
  order: ResumeSectionId[];
  visibility: Record<string, boolean>;
  onReorder: (newOrder: ResumeSectionId[]) => void;
  onToggleVisibility: (sectionId: ResumeSectionId) => void;
}

const SECTION_LABELS: Record<ResumeSectionId, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills & Competencies",
  projects: "Projects & Portfolio",
  certifications: "Certifications & Credentials",
  achievements: "Key Achievements & Honors",
  languages: "Languages",
  custom: "Custom Section",
};

export default function SectionReorderList({
  order,
  visibility,
  onReorder,
  onToggleVisibility,
}: SectionReorderListProps) {
  const move = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(index, 1);
    if (moved) {
      newOrder.splice(targetIndex, 0, moved);
      onReorder(newOrder);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
          <Layers size={14} className="text-indigo-600" />
          Section Order & Visibility
          </label>
          <p className="mt-1 text-[11px] text-slate-400">Control what appears and how it reads.</p>
        </div>
        <span className="text-[11px] font-medium text-slate-400">{order.filter((id) => visibility[id] !== false).length}/{order.length} visible</span>
      </div>

      <div className="space-y-1.5">
        {order.map((sectionId, idx) => {
          const isVisible = visibility[sectionId] !== false;
          return (
            <div
              key={sectionId}
              className={`flex min-h-10 items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
                isVisible
                  ? "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                  : "border-dashed border-slate-300 bg-slate-100/40 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={15} className="cursor-grab text-slate-400" />
                <span className="font-semibold">{SECTION_LABELS[sectionId] || sectionId}</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Move Up */}
                <button
                  type="button"
                  title="Move section up"
                  disabled={idx === 0}
                  onClick={() => move(idx, "up")}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ArrowUp size={13} />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  title="Move section down"
                  disabled={idx === order.length - 1}
                  onClick={() => move(idx, "down")}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ArrowDown size={13} />
                </button>

                {/* Visibility Toggle */}
                <button
                  type="button"
                  title={isVisible ? "Hide section" : "Show section"}
                  onClick={() => onToggleVisibility(sectionId)}
                  className={`ml-1 rounded-md p-1.5 transition ${
                    isVisible
                      ? "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
