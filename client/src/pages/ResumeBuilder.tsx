import React, { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  X,
  Award,
  AlertCircle,
  Plus,
  Check,
  FileCheck,
  Compass,
  BriefcaseBusiness,
  Save,
  Upload,
  History,
  Sliders,
  Eye,
  Trash2,
  FolderGit2,
  GraduationCap,
  Globe,
  Languages as LanguagesIcon,
  HelpCircle,
  CheckSquare,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ListPlus,
  ArrowUpRight,
} from "lucide-react";
import { auth, getResumeStorageKey, getStoredUserId } from "../lib/auth";
import { api, errMsg } from "../lib/api";

// Resume Components
import ResumeUpload, { ParsedResumePayload } from "../components/resume/ResumeUpload";
import ExtractedProfileReview from "../components/resume/ExtractedProfileReview";
import TemplateSelector, { ResumeTemplate } from "../components/resume/TemplateSelector";
import FontSelector, {
  ResumeFont,
  ResumeFontSize,
  PageMargins,
  BulletStyle,
  LayoutMode,
} from "../components/resume/FontSelector";
import AccentColorPicker from "../components/resume/AccentColorPicker";
import SectionReorderList, { ResumeSectionId } from "../components/resume/SectionReorderList";
import ResumeLivePreview from "../components/resume/ResumeLivePreview";
import ResumeExportButton from "../components/resume/ResumeExportButton";
import ResumeTailorModal from "../components/resume/ResumeTailorModal";
import ResumeVersionHistory from "../components/resume/ResumeVersionHistory";
import ATSReadinessPanel, { ATSChecklistData, ATSAuditResult } from "../components/resume/ATSReadinessPanel";
import { notifyCareerContextChanged } from "../lib/careerContext";

type Experience = { company: string; role: string; dates: string; details: string };
type Education = { school: string; degree: string; dates: string };
type Project = { name: string; link: string; details: string };
type Certification = { name: string; issuer: string; date: string };

type Resume = {
  template: ResumeTemplate;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  skills: string;
  achievements: string;
  languages: string;
  customTitle: string;
  customContent: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
};

const blankExperience = (): Experience => ({ company: "", role: "", dates: "", details: "" });
const blankEducation = (): Education => ({ school: "", degree: "", dates: "" });
const blankProject = (): Project => ({ name: "", link: "", details: "" });
const blankCertification = (): Certification => ({ name: "", issuer: "", date: "" });

const initial: Resume = {
  template: "modern",
  name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  summary: "",
  skills: "",
  achievements: "",
  languages: "English",
  customTitle: "",
  customContent: "",
  experience: [blankExperience()],
  education: [blankEducation()],
  projects: [],
  certifications: [],
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10";

export default function ResumeBuilder() {
  const [resume, setResume] = useState<Resume>(initial);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  // Responsive Mobile / Studio Tabs
  const [mobileTab, setMobileTab] = useState<"editor" | "design" | "ats" | "preview">("editor");

  // Typography & Layout Engine State
  const [fontFamily, setFontFamily] = useState<ResumeFont>("Inter");
  const [fontSize, setFontSize] = useState<ResumeFontSize>("regular");
  const [accentColor, setAccentColor] = useState<string>("#4f46e5");
  const [pageMargins, setPageMargins] = useState<PageMargins>("normal");
  const [bulletStyle, setBulletStyle] = useState<BulletStyle>("disc");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("multi_page");

  // Section Ordering & Visibility
  const [sectionOrder, setSectionOrder] = useState<ResumeSectionId[]>([
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "achievements",
    "languages",
    "custom",
  ]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    achievements: true,
    languages: true,
    custom: true,
  });

  // Upload & Review State
  const [parsedPayload, setParsedPayload] = useState<ParsedResumePayload | null>(null);

  // Tailoring & Version History Modals
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // ATS Readiness Checklist State & Live AI Audit
  const [atsChecklist, setAtsChecklist] = useState<ATSChecklistData>({
    keyword_coverage: { matched: [], missing: [], coverage_percent: 80 },
    heading_structure: {
      valid: true,
      notes: ["Standard ATS-compliant sections: Experience, Education, Skills, Summary, Projects."],
    },
    date_consistency: {
      valid: true,
      notes: ["Chronology formatting is clear and parser-readable."],
    },
    readability: {
      score: 88,
      notes: ["Concise bullet points with action verbs."],
    },
    layout_compatibility: {
      ats_safe: true,
      recommendations: ["Single-column / clean hierarchy optimized for standard ATS parsing."],
    },
    overall_readiness: "Good",
  });
  const [auditResult, setAuditResult] = useState<ATSAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // AI Assist Modals (Summary, Bullets)
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySuggestions, setSummarySuggestions] = useState<{ title: string; tag: string; text: string }[]>([]);

  const [bulletsModalOpen, setBulletsModalOpen] = useState(false);
  const [bulletsLoadingIndex, setBulletsLoadingIndex] = useState<number | null>(null);
  const [bulletSuggestions, setBulletSuggestions] = useState<string[]>([]);
  const [targetBulletIndex, setTargetBulletIndex] = useState<number | null>(null);

  // Load resume from API or localStorage
  useEffect(() => {
    let active = true;
    api
      .get("/api/resumes")
      .then(({ data }) => {
        if (active && data) {
          setResume((prev) => ({
            ...prev,
            ...data,
            experience: data.experience?.length ? data.experience : [blankExperience()],
            education: data.education?.length ? data.education : [blankEducation()],
            projects: Array.isArray(data.projects) ? data.projects : [],
            certifications: Array.isArray(data.certifications) ? data.certifications : [],
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not load backend resume, loading local storage:", err);
        const userId = getStoredUserId();
        if (userId) {
          try {
            const local = JSON.parse(localStorage.getItem(getResumeStorageKey(userId)) || "null");
            if (local && active) {
              setResume((prev) => ({ ...prev, ...local }));
            }
          } catch {}
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    const userId = getStoredUserId();
    if (userId) {
      localStorage.setItem(getResumeStorageKey(userId), JSON.stringify(resume));
    }
  }, [resume]);

  // Save to Backend on demand or change
  const saveToBackend = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      await api.put("/api/resumes", resume);
      notifyCareerContextChanged();
      setSaved(true);
      setSyncMsg("Resume saved successfully!");
      setTimeout(() => {
        setSaved(false);
        setSyncMsg("");
      }, 3500);
    } catch (err) {
      setSyncMsg(errMsg(err));
    } finally {
      setSyncing(false);
    }
  };

  // Sync from Profile
  const syncFromAccount = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await api.get("/api/profile");
      const p = res.data;
      if (p) {
        setResume((prev) => ({
          ...prev,
          name: p.full_name || prev.name,
          headline: p.target_role || prev.headline,
          phone: p.phone || prev.phone,
          location: p.location || prev.location,
          linkedin: p.linkedin || prev.linkedin,
          website: p.website || prev.website,
          summary: p.summary || prev.summary,
          skills: p.skills?.length ? p.skills.join(", ") : prev.skills,
        }));
        notifyCareerContextChanged();
        setSyncMsg("Synced latest profile information into resume builder!");
        setTimeout(() => setSyncMsg(""), 3500);
      }
    } catch {
      setSyncMsg("Could not sync details. Please verify your login status.");
      setTimeout(() => setSyncMsg(""), 3500);
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyTailored = (tailoredContent: any, checklist: any) => {
    setResume((prev) => ({
      ...prev,
      ...tailoredContent,
    }));
    if (checklist) {
      setAtsChecklist(checklist);
    }
    saveToBackend();
  };

  // Real-time AI ATS Audit Trigger
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await api.post("/api/resumes/ai-review", resume);
      if (res.data) {
        setAuditResult(res.data);
        if (res.data.missingKeywords) {
          setAtsChecklist((prev) => ({
            ...prev,
            keyword_coverage: {
              matched: prev.keyword_coverage?.matched || [],
              missing: res.data.missingKeywords,
              coverage_percent: Math.min(96, Math.max(55, res.data.atsScore)),
            },
            readability: {
              score: res.data.atsScore,
              notes: res.data.improvements || [],
            },
            overall_readiness:
              res.data.atsScore >= 88
                ? "Excellent"
                : res.data.atsScore >= 75
                ? "Good"
                : "Needs Improvement",
          }));
        }
        setSyncMsg(`AI ATS Audit complete! Score: ${res.data.atsScore}/100 · ${res.data.verdict}`);
        setTimeout(() => setSyncMsg(""), 4500);
      }
    } catch (err) {
      console.error("Audit error:", err);
      setSyncMsg("Could not complete audit. Please check your network and try again.");
      setTimeout(() => setSyncMsg(""), 4000);
    } finally {
      setIsAuditing(false);
    }
  };

  // Click-to-add missing keywords to Skills
  const handleAddKeyword = (kw: string) => {
    setResume((prev) => {
      const existing = prev.skills
        ? prev.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (!existing.some((s) => s.toLowerCase() === kw.toLowerCase())) {
        const updated = [...existing, kw].join(", ");
        return { ...prev, skills: updated };
      }
      return prev;
    });

    if (auditResult) {
      setAuditResult((prev) =>
        prev
          ? {
              ...prev,
              missingKeywords: prev.missingKeywords.filter(
                (k) => k.toLowerCase() !== kw.toLowerCase()
              ),
              atsScore: Math.min(98, prev.atsScore + 3),
            }
          : null
      );
    }

    setSyncMsg(`Added "${kw}" to skills!`);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  // AI Experience Bullets Generator
  const handleGenerateBullets = async (expIndex: number) => {
    const exp = resume.experience[expIndex];
    if (!exp) return;
    setTargetBulletIndex(expIndex);
    setBulletsLoadingIndex(expIndex);
    try {
      const res = await api.post("/api/resumes/ai-bullets", {
        role: exp.role || resume.headline || "Software Engineer",
        company: exp.company || "Tech Company",
        rawDetails: exp.details || "",
        skills: resume.skills || "",
      });
      if (res.data?.bullets?.length) {
        setBulletSuggestions(res.data.bullets);
        setBulletsModalOpen(true);
      }
    } catch (err) {
      console.error("AI Bullets error:", err);
      setSyncMsg("Could not generate bullets. Please check connection.");
      setTimeout(() => setSyncMsg(""), 3500);
    } finally {
      setBulletsLoadingIndex(null);
    }
  };

  // Field updater helpers
  const setField = (key: keyof Resume, value: any) =>
    setResume((prev) => ({ ...prev, [key]: value }));

  const updateItem = <T extends "experience" | "education" | "projects" | "certifications">(
    section: T,
    index: number,
    value: Partial<Resume[T][number]>
  ) => {
    const list = [...(resume[section] as any[])];
    list[index] = { ...list[index], ...value };
    setResume((prev) => ({ ...prev, [section]: list }));
  };

  const addItem = <T extends "experience" | "education" | "projects" | "certifications">(
    section: T,
    blankItem: Resume[T][number]
  ) => {
    setResume((prev) => ({ ...prev, [section]: [...(prev[section] as any[]), blankItem] }));
  };

  const removeItem = <T extends "experience" | "education" | "projects" | "certifications">(
    section: T,
    index: number
  ) => {
    const list = [...(resume[section] as any[])];
    list.splice(index, 1);
    setResume((prev) => ({ ...prev, [section]: list }));
  };

  return (
    <div className="resume-studio space-y-4 pb-16 lg:pb-0">
      {/* 1. Header Toolbar */}
      <div className="no-print flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Resume Studio</h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ATS Optimized
            </span>
          </div>
          <p className="mt-1 max-w-xl text-[11px] text-slate-500">
            Build an ATS-ready resume, tailor it for a role, and export it as a polished PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <History size={14} />
            <span>Versions</span>
          </button>

          <button
            onClick={() => setTailorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
          >
            <Sparkles size={14} />
            <span>Tailor for Job</span>
          </button>

          <button
            onClick={syncFromAccount}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sync Profile</span>
          </button>

          <button
            onClick={saveToBackend}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Save size={14} />
            <span>{saved ? "Saved!" : "Save"}</span>
          </button>

          <ResumeExportButton
            resumeContent={resume}
            template={resume.template}
            fontFamily={fontFamily}
            fontSize={fontSize}
            accentColor={accentColor}
            pageMargins={pageMargins}
            bulletStyle={bulletStyle}
          />
        </div>
      </div>

      {syncMsg && (
        <div className="no-print flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg("")} className="text-indigo-500 hover:text-indigo-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Smart Resume Parsing Upload Zone */}
      <div className="no-print">
        <ResumeUpload onParsed={(payload) => setParsedPayload(payload)} />
      </div>

      {/* 3. Extracted Profile Review Modal */}
      {parsedPayload && (
        <ExtractedProfileReview
          parsedData={parsedPayload.structuredData}
          parsedResumeId={parsedPayload.parsedResumeId}
          isScannedPdf={parsedPayload.isScannedPdf}
          warnings={parsedPayload.warnings}
          onConfirmed={({ resume: confirmedResume }) => {
            if (confirmedResume) {
              setResume((prev) => ({ ...prev, ...confirmedResume }));
            }
            setParsedPayload(null);
            setSyncMsg("Parsed resume data applied successfully!");
            setTimeout(() => setSyncMsg(""), 3500);
          }}
          onCancel={() => setParsedPayload(null)}
        />
      )}

      {/* 4. Responsive Segmented Tab Bar (Visible on Mobile & Tablet <lg) */}
      <div className="no-print flex items-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/50 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
            mobileTab === "editor"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText size={14} />
          <span>Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("design")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
            mobileTab === "design"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Design</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("ats")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
            mobileTab === "ats"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <CheckSquare size={14} />
          <span>ATS Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
            mobileTab === "preview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-indigo-600 dark:text-indigo-400"
          }`}
        >
          <Eye size={14} />
          <span>Preview</span>
        </button>
      </div>

      {/* 5. Main Responsive Grid Layout */}
      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* Left Column: Editor & Controls */}
        <div
          className={`no-print space-y-3 lg:col-span-5 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Design Controls Group (shown in design tab on mobile, always accessible on desktop) */}
          <div className={`space-y-3 ${mobileTab === "editor" || mobileTab === "ats" ? "hidden lg:block" : "block"}`}>
            {/* Template Selection */}
            <div className="professional-surface rounded-xl p-3">
              <TemplateSelector
                currentTemplate={resume.template}
                onSelect={(t) => setField("template", t)}
              />
            </div>

            {/* Typography Engine */}
            <FontSelector
              fontFamily={fontFamily}
              fontSize={fontSize}
              pageMargins={pageMargins}
              bulletStyle={bulletStyle}
              layoutMode={layoutMode}
              onChangeFont={setFontFamily}
              onChangeSize={setFontSize}
              onChangeMargins={setPageMargins}
              onChangeBulletStyle={setBulletStyle}
              onChangeLayoutMode={setLayoutMode}
            />

            {/* Accent Color Picker */}
            <AccentColorPicker color={accentColor} onChangeColor={setAccentColor} />

            {/* Section Ordering & Visibility */}
            <SectionReorderList
              order={sectionOrder}
              visibility={sectionVisibility}
              onReorder={setSectionOrder}
              onToggleVisibility={(id) =>
                setSectionVisibility((prev) => ({ ...prev, [id]: !prev[id] }))
              }
            />
          </div>

          {/* ATS Readiness Audit Panel (shown in ats tab on mobile, always visible on desktop) */}
          <div className={`${mobileTab === "design" || mobileTab === "editor" ? "hidden lg:block" : "block"}`}>
            <ATSReadinessPanel
              checklist={atsChecklist}
              auditResult={auditResult}
              isAuditing={isAuditing}
              onRunAudit={handleRunAudit}
              onAddKeyword={handleAddKeyword}
            />
          </div>

          {/* Comprehensive Content Form Editor (shown in editor tab on mobile, always visible on desktop) */}
          <div
            className={`professional-surface space-y-3 rounded-xl p-3 ${
              mobileTab === "design" || mobileTab === "ats" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText size={15} className="text-indigo-600" />
                Resume Content Sections
              </h3>
              <span className="text-[11px] text-slate-400">Auto-formatted</span>
            </div>

            {/* 1. Contact & Identity */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                1. Contact & Identity
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={resume.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Target Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={resume.headline}
                    onChange={(e) => setField("headline", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={resume.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={resume.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Location</label>
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    value={resume.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">LinkedIn URL</label>
                  <input
                    type="text"
                    placeholder="linkedin.com/in/janedoe"
                    value={resume.linkedin}
                    onChange={(e) => setField("linkedin", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Portfolio / Website</label>
                  <input
                    type="text"
                    placeholder="https://janedoe.dev or github.com/janedoe"
                    value={resume.website}
                    onChange={(e) => setField("website", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  2. Professional Summary
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryLoading(true);
                    api
                      .post("/api/resumes/ai-summary", {
                        role: resume.headline || "Software Engineer",
                        skills: resume.skills,
                        currentSummary: resume.summary,
                      })
                      .then((res) => {
                        if (res.data?.suggestions) {
                          setSummarySuggestions(res.data.suggestions);
                          setSummaryModalOpen(true);
                        }
                      })
                      .finally(() => setSummaryLoading(false));
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Sparkles size={12} className={summaryLoading ? "animate-spin" : ""} />
                  {summaryLoading ? "Generating..." : "AI Summary Options"}
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="High-impact summary highlighting qualifications, core competencies, and career objectives..."
                value={resume.summary}
                onChange={(e) => setField("summary", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* 3. Skills */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  3. Skills & Technologies (Comma-separated)
                </span>
                <span className="text-[10px] text-slate-400">
                  {resume.skills ? resume.skills.split(",").filter((s) => s.trim()).length : 0} skills
                </span>
              </div>
              <input
                type="text"
                placeholder="TypeScript, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS"
                value={resume.skills}
                onChange={(e) => setField("skills", e.target.value)}
                className={inputClass}
              />
              {resume.skills && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {resume.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* 4. Work Experience */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  4. Work Experience ({resume.experience.length})
                </span>
                <button
                  type="button"
                  onClick={() => addItem("experience", blankExperience())}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus size={13} /> Add Position
                </button>
              </div>

              {resume.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Position #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateBullets(idx)}
                        disabled={bulletsLoadingIndex === idx}
                        className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                      >
                        <Sparkles size={11} className={bulletsLoadingIndex === idx ? "animate-spin" : ""} />
                        <span>{bulletsLoadingIndex === idx ? "Drafting..." : "AI Bullets"}</span>
                      </button>

                      {resume.experience.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem("experience", idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Role Title"
                      value={exp.role}
                      onChange={(e) => updateItem("experience", idx, { role: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateItem("experience", idx, { company: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Dates (e.g. 2022 - Present)"
                      value={exp.dates}
                      onChange={(e) => updateItem("experience", idx, { dates: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">
                      Key accomplishments & metrics (one bullet per line):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="• Built distributed API gateway handling 10M daily requests with 99.99% uptime&#10;• Reduced latency by 40% via Redis caching layer"
                      value={exp.details}
                      onChange={(e) => updateItem("experience", idx, { details: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Education */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  5. Education ({resume.education.length})
                </span>
                <button
                  type="button"
                  onClick={() => addItem("education", blankEducation())}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus size={13} /> Add Education
                </button>
              </div>

              {resume.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Degree #{idx + 1}
                    </span>
                    {resume.education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem("education", idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Degree / Program"
                      value={edu.degree}
                      onChange={(e) => updateItem("education", idx, { degree: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="University / School"
                      value={edu.school}
                      onChange={(e) => updateItem("education", idx, { school: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g. 2024)"
                      value={edu.dates}
                      onChange={(e) => updateItem("education", idx, { dates: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 6. Projects & Portfolio */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  6. Projects & Portfolio ({resume.projects?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => addItem("projects", blankProject())}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus size={13} /> Add Project
                </button>
              </div>

              {(resume.projects || []).map((proj, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Project #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem("projects", idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => updateItem("projects", idx, { name: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Demo / GitHub Link"
                      value={proj.link}
                      onChange={(e) => updateItem("projects", idx, { link: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description, tech stack, and verifiable business/technical outcomes..."
                    value={proj.details}
                    onChange={(e) => updateItem("projects", idx, { details: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            {/* 7. Certifications */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  7. Certifications ({resume.certifications?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => addItem("certifications", blankCertification())}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus size={13} /> Add Certification
                </button>
              </div>

              {(resume.certifications || []).map((cert, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Credential #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem("certifications", idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={cert.name}
                      onChange={(e) => updateItem("certifications", idx, { name: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Issuing Organization (e.g. AWS)"
                      value={cert.issuer}
                      onChange={(e) => updateItem("certifications", idx, { issuer: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Year / Date"
                      value={cert.date}
                      onChange={(e) => updateItem("certifications", idx, { date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 8. Key Achievements */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                8. Key Achievements & Honors (One per line)
              </span>
              <textarea
                rows={2}
                placeholder="• Hackathon 1st Place Winner out of 50 teams&#10;• Promoted to Team Lead within 14 months"
                value={resume.achievements}
                onChange={(e) => setField("achievements", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* 9. Languages */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                9. Languages
              </span>
              <input
                type="text"
                placeholder="English (Fluent), Spanish (Conversational), Mandarin"
                value={resume.languages}
                onChange={(e) => setField("languages", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* 10. Custom Section */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                10. Custom Section (Optional)
              </span>
              <input
                type="text"
                placeholder="Section Title (e.g. Publications, Volunteer Work)"
                value={resume.customTitle}
                onChange={(e) => setField("customTitle", e.target.value)}
                className={inputClass}
              />
              <textarea
                rows={2}
                placeholder="Details for this custom section..."
                value={resume.customContent}
                onChange={(e) => setField("customContent", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Resume Preview */}
        <div
          className={`lg:col-span-7 sticky top-6 ${
            mobileTab !== "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="no-print mb-2.5 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Interactive A4 Document
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {layoutMode === "one_page" ? "Locked to 1 Page" : "Continuous Flow"}
            </span>
          </div>

          <ResumeLivePreview
            resume={resume}
            template={resume.template}
            fontFamily={fontFamily}
            fontSize={fontSize}
            accentColor={accentColor}
            pageMargins={pageMargins}
            bulletStyle={bulletStyle}
            layoutMode={layoutMode}
            sectionOrder={sectionOrder}
            sectionVisibility={sectionVisibility}
          />
        </div>
      </div>

      {/* Floating Action Button (FAB) on Mobile to toggle Preview */}
      <div className="no-print fixed bottom-20 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab((prev) => (prev === "preview" ? "editor" : "preview"))}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95"
        >
          {mobileTab === "preview" ? (
            <>
              <FileText size={16} />
              <span>Back to Editor</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>View A4 Resume</span>
            </>
          )}
        </button>
      </div>

      {/* AI Tailoring Modal */}
      <ResumeTailorModal
        isOpen={tailorModalOpen}
        onClose={() => setTailorModalOpen(false)}
        currentContent={resume}
        onTailoredApplied={handleApplyTailored}
      />

      {/* Resume Version History Modal */}
      <ResumeVersionHistory
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onRestoreVersion={(content) => {
          setResume((prev) => ({ ...prev, ...content }));
          setSyncMsg("Restored resume version to editor!");
          setTimeout(() => setSyncMsg(""), 3500);
        }}
      />

      {/* AI Summary Suggestions Modal */}
      {summaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                AI Generated Summary Options
              </h3>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {summarySuggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setField("summary", s.text);
                    setSummaryModalOpen(false);
                    setSyncMsg("Summary updated!");
                    setTimeout(() => setSyncMsg(""), 3000);
                  }}
                  className="rounded-xl border border-slate-200 p-4 hover:border-indigo-400 cursor-pointer dark:border-slate-800 transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{s.title}</span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Bullet Suggestions Modal */}
      {bulletsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                AI Experience Bullet Options
              </h3>
              <button
                onClick={() => setBulletsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Click any bullet to append it into your experience, or use "Apply All" to replace with all 4 bullets.
            </p>

            <div className="space-y-2.5">
              {bulletSuggestions.map((bullet, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (targetBulletIndex !== null) {
                      const exp = resume.experience[targetBulletIndex];
                      if (exp) {
                        const newDetails = exp.details ? `${exp.details.trim()}\n• ${bullet}` : `• ${bullet}`;
                        updateItem("experience", targetBulletIndex, { details: newDetails });
                        setSyncMsg(`Added bullet #${idx + 1} to position!`);
                        setTimeout(() => setSyncMsg(""), 3000);
                      }
                    }
                  }}
                  className="rounded-xl border border-slate-200 p-3 hover:border-indigo-400 cursor-pointer dark:border-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition flex items-start gap-2.5"
                >
                  <Plus size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBulletsModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (targetBulletIndex !== null) {
                    const allBullets = bulletSuggestions.map((b) => `• ${b}`).join("\n");
                    updateItem("experience", targetBulletIndex, { details: allBullets });
                    setBulletsModalOpen(false);
                    setSyncMsg("Replaced position bullets with AI suggestions!");
                    setTimeout(() => setSyncMsg(""), 3000);
                  }
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Apply All 4 Bullets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
