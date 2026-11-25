import React, { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { api, errMsg } from "../../lib/api";

export interface ParsedResumePayload {
  parsedResumeId: string;
  structuredData: any;
  isScannedPdf: boolean;
  warnings: string[];
}

interface ResumeUploadProps {
  onParsed: (data: ParsedResumePayload) => void;
}

export default function ResumeUpload({ onParsed }: ResumeUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate extension
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (![".pdf", ".docx", ".doc"].includes(ext)) {
      setError("Please upload a PDF or DOCX file (.pdf, .docx).");
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum supported file size is 10MB.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    try {
      setCurrentStep("Uploading document...");
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => {
        if (uploading) setCurrentStep("Extracting text and scanning structure...");
      }, 800);

      setTimeout(() => {
        if (uploading) setCurrentStep("Running AI Career Intelligence & schema parsing...");
      }, 1800);

      const res = await api.post("/api/resume/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        onParsed({
          parsedResumeId: res.data.parsedResumeId,
          structuredData: res.data.structuredData,
          isScannedPdf: res.data.isScannedPdf,
          warnings: res.data.warnings || [],
        });
      } else {
        throw new Error(res.data?.error || "Failed to parse resume.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUploading(false);
      setCurrentStep("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Smart Resume Upload & Profile Extractor
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles size={11} /> AI Powered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Upload your existing PDF or DOCX resume. hireReady-AI extracts skills, work chronology, and projects without fabricating credentials.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
            : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/40"
        } ${uploading ? "opacity-75 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 size={36} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {currentStep || "Processing Resume..."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedFile ? selectedFile.name : "Validating document..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Upload size={22} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag and drop your resume here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Supported formats: PDF, DOCX (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
