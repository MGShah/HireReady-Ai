import React, { useEffect, useState } from "react";
import { History, RotateCcw, Check, X, Eye, Sparkles, Calendar, Building, Briefcase } from "lucide-react";
import { api, errMsg } from "../../lib/api";

interface ResumeVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (content: any) => void;
}

export default function ResumeVersionHistory({
  isOpen,
  onClose,
  onRestoreVersion,
}: ResumeVersionHistoryProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      api
        .get("/api/resume/versions")
        .then((res) => {
          setVersions(res.data || []);
        })
        .catch((err) => {
          setError(errMsg(err));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handlePreview = async (id: string) => {
    try {
      const res = await api.get(`/api/resume/versions/${id}`);
      setSelectedVersion(res.data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await api.post(`/api/resume/versions/${id}/restore`);
      if (res.data?.success && res.data.content) {
        onRestoreVersion(res.data.content);
        onClose();
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <History size={16} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Resume Version History & Tailored Archives
              </h3>
              <p className="text-xs text-slate-500">
                Switch between tailored resumes created for different companies and role styles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading saved resume versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No tailored versions saved yet. Click "Tailor Resume" in the editor to create company-specific versions.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {ver.version_name}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                      {ver.company_style?.replace("_", " ") || "Tech"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Briefcase size={11} /> {ver.target_role}
                    </span>
                    {ver.target_company && (
                      <span className="flex items-center gap-1">
                        <Building size={11} /> {ver.target_company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />{" "}
                      {new Date(ver.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handlePreview(ver.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    <Eye size={13} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleRestore(ver.id)}
                    disabled={restoringId === ver.id}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <RotateCcw size={13} />
                    {restoringId === ver.id ? "Restoring..." : "Restore"}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Selected Version Preview Detail */}
          {selectedVersion && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Version Summary: {selectedVersion.version_name}
                </span>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close Preview
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {selectedVersion.tailored_content?.summary}
              </p>
              <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Skills: {selectedVersion.tailored_content?.skills}
              </div>
            </div>
          )}
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
