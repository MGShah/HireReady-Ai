import React from "react";
import { Palette, Check } from "lucide-react";

interface AccentColorPickerProps {
  color: string;
  onChangeColor: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Slate", hex: "#334155" },
  { name: "Emerald", hex: "#059669" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Amber", hex: "#d97706" },
  { name: "Teal", hex: "#0d9488" },
];

export default function AccentColorPicker({
  color,
  onChangeColor,
}: AccentColorPickerProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
          <Palette size={14} className="text-indigo-600" />
          Accent Color Theme
          </label>
          <p className="mt-1 text-[11px] text-slate-400">Choose a signature color for headings and highlights.</p>
        </div>
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-mono uppercase text-slate-500 dark:bg-slate-800">{color}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {PRESET_COLORS.map((preset) => {
          const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              title={preset.name}
              aria-label={`Use ${preset.name} accent color`}
              aria-pressed={isSelected}
              onClick={() => onChangeColor(preset.hex)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${isSelected ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white" : ""}`}
              style={{ backgroundColor: preset.hex }}
            >
              {isSelected && <Check size={14} className="text-white drop-shadow" />}
            </button>
          );
        })}

        {/* Custom Hex input */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-slate-400">#</span>
          <input
            type="text"
            value={color.replace(/^#/, "")}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 6);
              if (val.length === 6) {
                onChangeColor(`#${val}`);
              }
            }}
            placeholder="4f46e5"
            maxLength={6}
            aria-label="Custom accent color hex value"
            className="w-24 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-mono text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
          />
        </div>
      </div>
    </div>
  );
}
