import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, User, Briefcase, GraduationCap, Code2, Award, Globe, Save, X, Sparkles } from "lucide-react";
import { api, errMsg } from "../../lib/api";

interface ExtractedProfileReviewProps {
  parsedData: any;
  parsedResumeId?: string;
  isScannedPdf?: boolean;
  warnings?: string[];
  onConfirmed: (data: { profile: any; resume: any }) => void;
  onCancel: () => void;
}

export default function ExtractedProfileReview({
  parsedData,
  parsedResumeId,
  isScannedPdf,
  warnings = [],
  onConfirmed,
  onCancel,
}: ExtractedProfileReviewProps) {
  const [data, setData] = useState({
    full_name: parsedData.full_name || "",
    email: parsedData.email || "",
    phone: parsedData.phone || "",
    location: parsedData.location || "",
    linkedin: parsedData.linkedin || "",
    github: parsedData.github || "",
    portfolio: parsedData.portfolio || "",
    summary: parsedData.summary || "",
    hard_skills: parsedData.hard_skills || [],
    soft_skills: parsedData.soft_skills || [],
    experience: parsedData.experience || [],
    education: parsedData.education || [],
    projects: parsedData.projects || [],
    certifications: parsedData.certifications || [],
    domain_specializations: parsedData.domain_specializations || [],
    languages: parsedData.languages || ["English"],
    accomplishments: parsedData.accomplishments || [],
  });

  const [activeTab, setActiveTab] = useState<"basics" | "experience" | "education" | "skills" | "projects">("basics");
  const [updateProfile, setUpdateProfile] = useState(true);
  const [updateResumeBuilder, setUpdateResumeBuilder] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post("/api/resume/confirm-parsed", {
        parsedResumeId,
        updateProfile,
        updateResumeBuilder,
        confirmedData: data,
      });

      if (res.data?.success) {
        onConfirmed({
          profile: res.data.profile,
          resume: res.data.resume,
        });
      } else {
        throw new Error(res.data?.message || "Failed to confirm profile information.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Review & Confirm Extracted Information
              </h2>
              <p className="text-xs text-slate-500">
                Verify and edit your parsed resume data. Nothing will overwrite your profile without confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warnings */}
        {(isScannedPdf || warnings.length > 0) && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span>
              {warnings[0] || "This resume had sparse text extraction. Please review the extracted fields below."}
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 dark:border-slate-800 overflow-x-auto">
          {[
            { id: "basics", label: "Contact & Summary", icon: User },
            { id: "skills", label: "Skills & Specialization", icon: Code2 },
            { id: "experience", label: "Work Experience", icon: Briefcase },
            { id: "education", label: "Education", icon: GraduationCap },
            { id: "projects", label: "Projects & Certs", icon: Award },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === id
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "basics" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={data.full_name}
                    onChange={(e) => setData({ ...data, full_name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">LinkedIn URL</label>
                  <input
                    type="text"
                    value={data.linkedin}
                    onChange={(e) => setData({ ...data, linkedin: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">GitHub URL</label>
                  <input
                    type="text"
                    value={data.github}
                    onChange={(e) => setData({ ...data, github: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Professional Summary</label>
                <textarea
                  rows={4}
                  value={data.summary}
                  onChange={(e) => setData({ ...data, summary: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hard Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={data.hard_skills.join(", ")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      hard_skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Soft Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={data.soft_skills.join(", ")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      soft_skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Domain Specializations (Comma-separated)
                </label>
                <input
                  type="text"
                  value={data.domain_specializations.join(", ")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      domain_specializations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-3">
              {data.experience.map((exp: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Role / Position"
                      value={exp.position || exp.role}
                      onChange={(e) => {
                        const copy = [...data.experience];
                        copy[idx] = { ...copy[idx], position: e.target.value, role: e.target.value };
                        setData({ ...data, experience: copy });
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const copy = [...data.experience];
                        copy[idx] = { ...copy[idx], company: e.target.value };
                        setData({ ...data, experience: copy });
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Dates"
                      value={exp.dates}
                      onChange={(e) => {
                        const copy = [...data.experience];
                        copy[idx] = { ...copy[idx], dates: e.target.value };
                        setData({ ...data, experience: copy });
                      }}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Responsibilities & Achievements (one per line)"
                    value={
                      Array.isArray(exp.responsibilities)
                        ? exp.responsibilities.join("\n")
                        : exp.details || ""
                    }
                    onChange={(e) => {
                      const copy = [...data.experience];
                      const lines = e.target.value.split("\n");
                      copy[idx] = {
                        ...copy[idx],
                        responsibilities: lines,
                        details: e.target.value,
                      };
                      setData({ ...data, experience: copy });
                    }}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-3">
              {data.education.map((edu: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution || edu.school}
                    onChange={(e) => {
                      const copy = [...data.education];
                      copy[idx] = { ...copy[idx], institution: e.target.value, school: e.target.value };
                      setData({ ...data, education: copy });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => {
                      const copy = [...data.education];
                      copy[idx] = { ...copy[idx], degree: e.target.value };
                      setData({ ...data, education: copy });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.graduation_year || edu.dates}
                    onChange={(e) => {
                      const copy = [...data.education];
                      copy[idx] = { ...copy[idx], graduation_year: e.target.value, dates: e.target.value };
                      setData({ ...data, education: copy });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Verified projects and certifications parsed from your document:
              </p>
              {data.projects.map((proj: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{proj.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{proj.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with confirmation toggles & actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={updateProfile}
                onChange={(e) => setUpdateProfile(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Update My hireReady-AI Profile
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={updateResumeBuilder}
                onChange={(e) => setUpdateResumeBuilder(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Update Active Resume Builder
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || (!updateProfile && !updateResumeBuilder)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <Save size={14} />
              {saving ? "Confirming..." : "Confirm & Apply"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300 border-t border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
