import { api } from "./api";
import { getResumeStorageKey, getStoredUserId } from "./auth";

export type CandidateResume = {
  name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  summary?: string;
  skills?: string;
  experience?: { role?: string; company?: string; dates?: string; details?: string }[];
  education?: { degree?: string; school?: string; dates?: string }[];
  projects?: { name?: string; link?: string; details?: string }[];
  certifications?: { name?: string; issuer?: string; date?: string }[];
};

export type CandidateProfile = {
  full_name?: string;
  education?: string;
  college?: string;
  graduation_year?: number;
  skills?: string[];
  target_role?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
};

export type CareerContext = {
  profile: CandidateProfile;
  resume: CandidateResume;
  skills: string[];
  targetRole: string;
  evidenceText: string;
};

export const CAREER_CONTEXT_UPDATED_EVENT = "hireReady-career-context-updated";

export function notifyCareerContextChanged(): void {
  window.dispatchEvent(new Event(CAREER_CONTEXT_UPDATED_EVENT));
}

export function subscribeToCareerContext(listener: () => void): () => void {
  window.addEventListener(CAREER_CONTEXT_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CAREER_CONTEXT_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function parseLocalResume(): CandidateResume | null {
  const userId = getStoredUserId();
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(getResumeStorageKey(userId)) ?? "null") as CandidateResume | null;
  } catch {
    return null;
  }
}

export async function loadCareerContext(): Promise<CareerContext> {
  const [profileResult, resumeResult] = await Promise.allSettled([
    api.get("/api/profile"),
    api.get("/api/resumes"),
  ]);
  const profile = profileResult.status === "fulfilled" ? (profileResult.value.data ?? {}) : {};
  const serverResume = resumeResult.status === "fulfilled" ? (resumeResult.value.data ?? {}) : {};
  const resume = { ...(parseLocalResume() ?? {}), ...serverResume };
  const skills = Array.from(new Set([
    ...(profile.skills ?? []),
    ...(resume.skills?.split(",").map((skill: string) => skill.trim()).filter(Boolean) ?? []),
  ]));
  const targetRole = resume.headline || profile.target_role || "";
  const evidenceText = [
    targetRole,
    resume.summary,
    ...skills,
    ...(resume.experience ?? []).flatMap((item: NonNullable<CandidateResume["experience"]>[number]) => [item.role, item.company, item.details]),
    ...(resume.education ?? []).flatMap((item: NonNullable<CandidateResume["education"]>[number]) => [item.degree, item.school]),
    ...(resume.projects ?? []).flatMap((item: NonNullable<CandidateResume["projects"]>[number]) => [item.name, item.details]),
  ].filter(Boolean).join(" ");
  return { profile, resume, skills, targetRole, evidenceText };
}
