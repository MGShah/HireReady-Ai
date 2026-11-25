import React, { useState } from "react";
import { Mail, Phone, MapPin, Globe, Linkedin, ExternalLink, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { ResumeTemplate } from "./TemplateSelector";
import { ResumeFont, ResumeFontSize, PageMargins, BulletStyle, LayoutMode } from "./FontSelector";
import { ResumeSectionId } from "./SectionReorderList";

interface ResumeLivePreviewProps {
  resume: any;
  template: ResumeTemplate;
  fontFamily: ResumeFont;
  fontSize: ResumeFontSize;
  accentColor: string;
  pageMargins: PageMargins;
  bulletStyle: BulletStyle;
  layoutMode: LayoutMode;
  sectionOrder: ResumeSectionId[];
  sectionVisibility: Record<string, boolean>;
}

export default function ResumeLivePreview({
  resume,
  template,
  fontFamily,
  fontSize,
  accentColor,
  pageMargins,
  bulletStyle,
  layoutMode,
  sectionOrder,
  sectionVisibility,
}: ResumeLivePreviewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Font family class
  const fontClassMap: Record<ResumeFont, string> = {
    Inter: "font-inter",
    Roboto: "font-roboto",
    Merriweather: "font-merriweather",
    "JetBrains Mono": "font-jetbrains",
    Lato: "font-lato",
  };
  const fontClass = fontClassMap[fontFamily] || "font-inter";

  // Margins padding
  const marginPaddingMap: Record<PageMargins, string> = {
    compact: "p-6",
    normal: "p-10",
    spacious: "p-14",
  };
  const marginPadding = marginPaddingMap[pageMargins] || "p-10";

  // Font size scales
  const sizeScales: Record<ResumeFontSize, { name: string; title: string; section: string; body: string; meta: string }> = {
    small: {
      name: "text-xl",
      title: "text-xs",
      section: "text-xs",
      body: "text-[11px]",
      meta: "text-[10px]",
    },
    regular: {
      name: "text-2xl",
      title: "text-sm",
      section: "text-sm",
      body: "text-xs",
      meta: "text-[11px]",
    },
    large: {
      name: "text-3xl",
      title: "text-base",
      section: "text-base",
      body: "text-sm",
      meta: "text-xs",
    },
  };
  const sizes = sizeScales[fontSize] || sizeScales.regular;

  // Bullet style marker
  const bulletMarkers: Record<BulletStyle, string> = {
    disc: "•",
    dash: "–",
    arrow: "›",
    square: "▪",
  };
  const bulletMarker = bulletMarkers[bulletStyle] || "•";

  // Section Header Generator
  const renderSectionHeader = (title: string) => {
    if (template === "executive") {
      return (
        <div className="mb-2 mt-4 avoid-break">
          <h3
            className={`font-bold uppercase tracking-wider ${sizes.section}`}
            style={{ color: accentColor }}
          >
            {title}
          </h3>
          <div className="h-0.5 w-full mt-1 bg-slate-200" />
        </div>
      );
    }
    if (template === "minimal") {
      return (
        <div className="mb-2 mt-4 avoid-break">
          <h3
            className={`font-bold tracking-tight ${sizes.section} border-b pb-1`}
            style={{ color: accentColor, borderColor: "#e2e8f0" }}
          >
            {title}
          </h3>
        </div>
      );
    }
    // Modern / Classic
    return (
      <div className="mb-2.5 mt-4 avoid-break">
        <h3
          className={`font-bold uppercase tracking-wider ${sizes.section}`}
          style={{ color: accentColor }}
        >
          {title}
        </h3>
        <div className="h-px w-full mt-1 bg-slate-200" />
      </div>
    );
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.55, Math.round((prev + delta) * 10) / 10)));
  };

  return (
    <div className="space-y-3">
      {/* Zoom / Scale Toolbar for Live Preview */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">A4 Zoom:</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            disabled={zoomLevel <= 0.55}
            title="Zoom Out"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomOut size={14} />
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="Reset to 100%"
            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            100%
          </button>

          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            disabled={zoomLevel >= 1.4}
            title="Zoom In"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel(0.85)}
            title="Fit to Page Width"
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Fit Width</span>
          </button>
        </div>
      </div>

      {/* Responsive Preview Scroll / Scale Viewport */}
      <div className="w-full overflow-x-auto rounded-2xl pb-4">
        <div
          style={{
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: "top left",
            width: zoomLevel !== 1 ? `${(1 / zoomLevel) * 100}%` : "100%",
            transition: "transform 0.2s ease-out",
          }}
        >
          <div
            id="nexa-resume-preview"
            className={`print-area relative w-full rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl transition-all ${fontClass} ${marginPadding} ${
              layoutMode === "one_page" ? "min-h-[960px] max-h-[1140px] overflow-hidden" : "min-h-[1020px]"
            }`}
            style={{
              boxSizing: "border-box",
            }}
          >
            {/* 1. Header Area */}
            <header className="mb-5 avoid-break">
              {template === "modern" && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-1.5 self-stretch rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex-1">
                    <h1 className={`font-black tracking-tight text-slate-950 ${sizes.name}`}>
                      {resume.name || "Your Full Name"}
                    </h1>
                    {resume.headline && (
                      <p
                        className={`font-semibold mt-0.5 ${sizes.title}`}
                        style={{ color: accentColor }}
                      >
                        {resume.headline}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {template === "executive" && (
                <div className="text-center border-b pb-4 border-slate-200">
                  <h1 className={`font-serif font-black uppercase tracking-wider text-slate-950 ${sizes.name}`}>
                    {resume.name || "Your Full Name"}
                  </h1>
                  {resume.headline && (
                    <p className={`font-serif tracking-widest text-slate-600 uppercase mt-1 ${sizes.title}`}>
                      {resume.headline}
                    </p>
                  )}
                </div>
              )}

              {template === "academic" && (
                <div className="border-b-2 pb-3 mb-3 border-slate-800">
                  <h1 className={`font-bold text-slate-950 ${sizes.name}`}>
                    {resume.name || "Your Full Name"}
                  </h1>
                  {resume.headline && (
                    <p className={`font-serif italic text-slate-700 mt-0.5 ${sizes.title}`}>
                      {resume.headline}
                    </p>
                  )}
                </div>
              )}

              {template === "minimal" && (
                <div>
                  <h1 className={`font-light tracking-tight text-slate-950 ${sizes.name}`}>
                    {resume.name || "Your Full Name"}
                  </h1>
                  {resume.headline && (
                    <p className={`font-medium text-slate-500 mt-0.5 ${sizes.title}`}>
                      {resume.headline}
                    </p>
                  )}
                </div>
              )}

              {/* Contact Info Line */}
              <div
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 mt-3 ${sizes.meta} ${
                  template === "executive" ? "justify-center" : "justify-start"
                }`}
              >
                {resume.email && <span>{resume.email}</span>}
                {resume.phone && <span>{resume.phone}</span>}
                {resume.location && <span>{resume.location}</span>}
                {resume.linkedin && (
                  <span className="truncate max-w-[220px]">{resume.linkedin}</span>
                )}
                {resume.website && (
                  <span className="truncate max-w-[200px]">{resume.website}</span>
                )}
              </div>
            </header>

            {/* Dynamic Sections Based on User Reordering & Visibility */}
            <div className="space-y-4">
              {sectionOrder.map((sectionId) => {
                if (sectionVisibility[sectionId] === false) return null;

                switch (sectionId) {
                  case "summary":
                    return resume.summary ? (
                      <section key="summary" className="avoid-break">
                        {renderSectionHeader("Professional Summary")}
                        <p className={`leading-relaxed text-slate-700 ${sizes.body}`}>
                          {resume.summary}
                        </p>
                      </section>
                    ) : null;

                  case "experience":
                    return resume.experience && resume.experience.length ? (
                      <section key="experience">
                        {renderSectionHeader("Experience")}
                        <div className="space-y-3">
                          {resume.experience.map((exp: any, i: number) => {
                            if (!exp.role && !exp.company && !exp.details) return null;
                            return (
                              <div key={i} className="avoid-break space-y-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-1">
                                  <span className={`font-bold text-slate-900 ${sizes.body}`}>
                                    {exp.role || "Role"}
                                    {exp.company && (
                                      <span className="font-semibold text-slate-700">
                                        {" "}· {exp.company}
                                      </span>
                                    )}
                                  </span>
                                  {exp.dates && (
                                    <span className={`font-medium text-slate-500 ${sizes.meta}`}>
                                      {exp.dates}
                                    </span>
                                  )}
                                </div>
                                {exp.details && (
                                  <div className="space-y-1 pl-2">
                                    {exp.details
                                      .split(/\r?\n/)
                                      .map((line: string) => line.trim())
                                      .filter(Boolean)
                                      .map((bullet: string, bIdx: number) => (
                                        <div
                                          key={bIdx}
                                          className={`flex items-start gap-2 text-slate-700 leading-snug ${sizes.body}`}
                                        >
                                          <span
                                            className="font-bold select-none"
                                            style={{ color: accentColor }}
                                          >
                                            {bulletMarker}
                                          </span>
                                          <span>{bullet.replace(/^[•\-*▪›]\s*/, "")}</span>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null;

                  case "skills":
                    return resume.skills ? (
                      <section key="skills" className="avoid-break">
                        {renderSectionHeader("Skills & Competencies")}
                        <p className={`leading-relaxed text-slate-700 ${sizes.body}`}>
                          {resume.skills}
                        </p>
                      </section>
                    ) : null;

                  case "education":
                    return resume.education && resume.education.length ? (
                      <section key="education" className="avoid-break">
                        {renderSectionHeader("Education")}
                        <div className="space-y-2">
                          {resume.education.map((edu: any, i: number) => {
                            if (!edu.degree && !edu.school) return null;
                            return (
                              <div key={i} className="flex justify-between items-baseline gap-2">
                                <div className={sizes.body}>
                                  <span className="font-bold text-slate-900">{edu.degree}</span>
                                  {edu.school && <span className="text-slate-700">, {edu.school}</span>}
                                </div>
                                {edu.dates && (
                                  <span className={`text-slate-500 font-medium ${sizes.meta}`}>
                                    {edu.dates}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null;

                  case "projects":
                    return resume.projects && resume.projects.length ? (
                      <section key="projects">
                        {renderSectionHeader("Projects & Portfolio")}
                        <div className="space-y-2.5">
                          {resume.projects.map((proj: any, i: number) => {
                            if (!proj.name) return null;
                            return (
                              <div key={i} className="avoid-break space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-slate-900 ${sizes.body}`}>
                                    {proj.name}
                                  </span>
                                  {proj.link && (
                                    <span className={`text-indigo-600 ${sizes.meta}`}>
                                      ({proj.link})
                                    </span>
                                  )}
                                </div>
                                {proj.details && (
                                  <p className={`text-slate-700 pl-2 ${sizes.body}`}>
                                    {proj.details}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null;

                  case "certifications":
                    return resume.certifications && resume.certifications.length ? (
                      <section key="certifications" className="avoid-break">
                        {renderSectionHeader("Certifications")}
                        <div className="space-y-1">
                          {resume.certifications.map((cert: any, i: number) => {
                            if (!cert.name) return null;
                            return (
                              <div key={i} className="flex justify-between items-baseline gap-2">
                                <div className={sizes.body}>
                                  <span className="font-semibold text-slate-900">{cert.name}</span>
                                  {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                                </div>
                                {cert.date && (
                                  <span className={`text-slate-500 ${sizes.meta}`}>{cert.date}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null;

                  case "achievements":
                    return resume.achievements ? (
                      <section key="achievements" className="avoid-break">
                        {renderSectionHeader("Key Achievements & Honors")}
                        <div className="space-y-1 pl-2">
                          {resume.achievements
                            .split(/\r?\n/)
                            .map((line: string) => line.trim())
                            .filter(Boolean)
                            .map((item: string, aIdx: number) => (
                              <div
                                key={aIdx}
                                className={`flex items-start gap-2 text-slate-700 leading-snug ${sizes.body}`}
                              >
                                <span
                                  className="font-bold select-none"
                                  style={{ color: accentColor }}
                                >
                                  {bulletMarker}
                                </span>
                                <span>{item.replace(/^[•\-*▪›]\s*/, "")}</span>
                              </div>
                            ))}
                        </div>
                      </section>
                    ) : null;

                  case "languages":
                    return resume.languages ? (
                      <section key="languages" className="avoid-break">
                        {renderSectionHeader("Languages")}
                        <p className={`leading-relaxed text-slate-700 ${sizes.body}`}>
                          {resume.languages}
                        </p>
                      </section>
                    ) : null;

                  case "custom":
                    return resume.customTitle && resume.customContent ? (
                      <section key="custom" className="avoid-break">
                        {renderSectionHeader(resume.customTitle || "Additional Information")}
                        <p className={`leading-relaxed text-slate-700 ${sizes.body} whitespace-pre-line`}>
                          {resume.customContent}
                        </p>
                      </section>
                    ) : null;

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
