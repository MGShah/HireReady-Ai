import React from "react";
import { Type, Sliders } from "lucide-react";

export type ResumeFont = "Inter" | "Roboto" | "Merriweather" | "JetBrains Mono" | "Lato";
export type ResumeFontSize = "small" | "regular" | "large";
export type PageMargins = "compact" | "normal" | "spacious";
export type BulletStyle = "disc" | "dash" | "arrow" | "square";
export type LayoutMode = "one_page" | "multi_page";

interface TypographyControlsProps {
  fontFamily: ResumeFont;
  fontSize: ResumeFontSize;
  pageMargins: PageMargins;
  bulletStyle: BulletStyle;
  layoutMode: LayoutMode;
  onChangeFont: (font: ResumeFont) => void;
  onChangeSize: (size: ResumeFontSize) => void;
  onChangeMargins: (margins: PageMargins) => void;
  onChangeBulletStyle: (bullet: BulletStyle) => void;
  onChangeLayoutMode: (mode: LayoutMode) => void;
}

const FONTS: { id: ResumeFont; label: string; style: string; sample: string }[] = [
  { id: "Inter", label: "Inter", style: "font-inter", sample: "Clean Modern Sans" },
  { id: "Roboto", label: "Roboto", style: "font-roboto", sample: "Standard Neo-Grotesque" },
  { id: "Merriweather", label: "Merriweather", style: "font-merriweather", sample: "Refined Executive Serif" },
  { id: "JetBrains Mono", label: "JetBrains Mono", style: "font-jetbrains", sample: "Technical Monospace" },
  { id: "Lato", label: "Lato", style: "font-lato", sample: "Warm Humanist Sans" },
];

export default function FontSelector({
  fontFamily,
  fontSize,
  pageMargins,
  bulletStyle,
  layoutMode,
  onChangeFont,
  onChangeSize,
  onChangeMargins,
  onChangeBulletStyle,
  onChangeLayoutMode,
}: TypographyControlsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
          <Type size={14} className="text-indigo-600" />
          Typography & Layout Engine
          </label>
          <p className="mt-1 text-[11px] text-slate-400">Shape the visual rhythm of your resume.</p>
        </div>
      </div>

      {/* Font Family Selection */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FONTS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChangeFont(f.id)}
            aria-pressed={fontFamily === f.id}
            className={`min-w-0 rounded-xl border p-2.5 text-left transition ${f.style} ${
              fontFamily === f.id
                ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-2 ring-indigo-100 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-950"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-700"
            }`}
          >
            <span className="block truncate text-sm font-bold">{f.label}</span>
            <span className="mt-0.5 block truncate text-[10px] text-slate-400">{f.sample}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-2">
        {/* Font Size */}
        <div>
          <label className="flex min-h-8 items-end pb-1 text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-400">
            Font Scale
          </label>
          <div className="flex min-h-9 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {(["small", "regular", "large"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSize(s)}
                aria-pressed={fontSize === s}
                className={`min-w-0 flex-1 px-1 py-1 text-center text-[11px] font-medium capitalize transition ${
                  fontSize === s
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Page Margins */}
        <div>
          <label className="flex min-h-8 items-end pb-1 text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-400">
            Margins & Density
          </label>
          <div className="flex min-h-9 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {(["compact", "normal", "spacious"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onChangeMargins(m)}
                aria-pressed={pageMargins === m}
                className={`min-w-0 flex-1 px-1 py-1 text-center text-[11px] font-medium capitalize transition ${
                  pageMargins === m
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Bullet Style */}
        <div>
          <label className="flex min-h-8 items-end pb-1 text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-400">
            Bullet Marker
          </label>
          <div className="flex min-h-9 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {[
              { id: "disc", label: "• Dot" },
              { id: "dash", label: "– Dash" },
              { id: "arrow", label: "› Arrow" },
              { id: "square", label: "▪ Square" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onChangeBulletStyle(id as any)}
                aria-label={label}
                aria-pressed={bulletStyle === id}
                className={`min-w-0 flex-1 px-1 py-1 text-center text-[11px] font-medium transition ${
                  bulletStyle === id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Page Limit / Layout Mode */}
        <div>
          <label className="flex min-h-8 items-end pb-1 text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-400">
            Page Layout Mode
          </label>
          <div className="flex min-h-9 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {[
              { id: "one_page", label: "1 Page Lock" },
              { id: "multi_page", label: "Multi-Page Flow" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onChangeLayoutMode(id as any)}
                aria-pressed={layoutMode === id}
                className={`min-w-0 flex-1 px-1 py-1 text-center text-[11px] font-medium leading-tight transition ${
                  layoutMode === id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
