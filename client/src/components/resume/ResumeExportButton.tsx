import React, { useState } from "react";
import { Download, Printer, Loader2, CheckCircle2 } from "lucide-react";
import { api, errMsg } from "../../lib/api";

interface ResumeExportButtonProps {
  resumeContent: any;
  template: string;
  fontFamily: string;
  fontSize: string;
  accentColor: string;
  pageMargins: string;
  bulletStyle: string;
}

export default function ResumeExportButton({
  resumeContent,
  template,
  fontFamily,
  fontSize,
  accentColor,
  pageMargins,
  bulletStyle,
}: ResumeExportButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      const response = await api.post(
        "/api/resume/export",
        {
          content: resumeContent,
          template,
          fontFamily,
          fontSize,
          accentColor,
          marginOption: pageMargins,
          bulletStyle,
        },
        {
          responseType: "blob",
        }
      );

      // Create download link from blob
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (resumeContent.name || "Resume")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${cleanName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("PDF export error:", err);
      setError("Server PDF generation failed. Opening print preview as fallback...");
      setTimeout(() => {
        window.print();
      }, 1000);
    } finally {
      setDownloading(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <button
        onClick={handleBrowserPrint}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition shadow-sm"
        title="Print or Save via Browser"
      >
        <Printer size={15} />
        <span>Print Preview</span>
      </button>

      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition ${
          downloadSuccess
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        } disabled:opacity-50`}
      >
        {downloading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Generating A4 PDF...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle2 size={15} />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Download size={15} />
            <span>Download Vector PDF</span>
          </>
        )}
      </button>

      {error && <span className="text-[11px] text-amber-600 dark:text-amber-400">{error}</span>}
    </div>
  );
}
