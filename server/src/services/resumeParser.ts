import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import zlib from "zlib";
import { z } from "zod";
import { askJson } from "./ai";
import { IParsedStructuredData } from "../models/ParsedResume";
import { AppError } from "../middleware/error";

export const parsedResumeSchema = z.object({
  full_name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  portfolio: z.string().default(""),
  summary: z.string().default(""),
  hard_skills: z.array(z.string()).default([]),
  soft_skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        position: z.string().default(""),
        dates: z.string().default(""),
        responsibilities: z.array(z.string()).default([]),
        achievements: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        degree: z.string().default(""),
        graduation_year: z.string().default(""),
        details: z.string().optional().default(""),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),
        technologies: z.array(z.string()).default([]),
        measurable_outcomes: z.string().optional().default(""),
        link: z.string().optional().default(""),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default(""),
        date: z.string().default(""),
      })
    )
    .default([]),
  domain_specializations: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  accomplishments: z.array(z.string()).default([]),
});

export type ParsedResumeOutput = z.infer<typeof parsedResumeSchema>;

/**
 * Sanitize raw resume text to mitigate prompt-injection attempts.
 */
export function sanitizeResumeText(rawText: string): string {
  if (!rawText) return "";
  // Strip control chars (keep newlines/tabs)
  let clean = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Neutralize common prompt injection patterns
  clean = clean.replace(/(\b)(system|assistant|instruction|prompt)\s*:/gi, "$1[filtered]:");
  clean = clean.replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "[filtered injection attempt]");
  return clean.trim();
}

/**
 * Extract raw text from PDF or DOCX buffer.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  originalFilename: string
): Promise<{ text: string; isScannedPdf: boolean; pageCount: number }> {
  const isPdf =
    mimeType === "application/pdf" ||
    originalFilename.toLowerCase().endsWith(".pdf");
  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    originalFilename.toLowerCase().endsWith(".docx");

  if (!isPdf && !isDocx) {
    throw new AppError(
      400,
      `Unsupported file type: ${mimeType}. Please upload a PDF or DOCX resume.`
    );
  }

  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      return { text, isScannedPdf: false, pageCount: 1 };
    } catch (err: any) {
      throw new AppError(400, `Failed to parse DOCX file: ${err.message || err}`);
    }
  }

  // Handle PDF
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || "").trim();
    const pageCount = data.numpages || 1;

    // Detect scanned PDF: very little or no extracted text
    const charCount = text.replace(/\s+/g, "").length;
    const isScannedPdf = charCount < 60 || charCount / pageCount < 30;

    return { text, isScannedPdf, pageCount };
  } catch (err: any) {
    // If standard pdfParse encounters an XRef anomaly (e.g. from PDFKit or non-standard tools),
    // fall back to stream decompression to reliably recover all text
    const fallbackText = extractPdfTextStreamFallback(buffer);
    if (fallbackText !== null) {
      const charCount = fallbackText.replace(/\s+/g, "").length;
      const isScannedPdf = charCount < 60;
      return { text: fallbackText, isScannedPdf, pageCount: 1 };
    }
    throw new AppError(400, `Failed to parse PDF file: ${err.message || err}`);
  }
}

/**
 * Direct stream decompression fallback for PDFs with non-standard XRef tables.
 */
export function extractPdfTextStreamFallback(buffer: Buffer): string | null {
  try {
    const str = buffer.toString("binary");
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    let text = "";

    while ((match = streamRegex.exec(str)) !== null) {
      const streamData = match[1];
      if (!streamData) continue;

      try {
        const decompressed = zlib.inflateSync(Buffer.from(streamData, "binary")).toString("latin1");
        const tjRegex = /(?:\[(.*?)\]\s*TJ|\((.*?)\)\s*Tj)/g;
        let tjMatch: RegExpExecArray | null;
        while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
          const content = tjMatch[1] || tjMatch[2] || "";
          const hexParts = content.match(/<([0-9a-fA-F]+)>/g);
          if (hexParts) {
            for (const hp of hexParts) {
              const h = hp.replace(/[<>]/g, "");
              text += Buffer.from(h, "hex").toString("utf8");
            }
            text += " ";
          } else if (tjMatch[2]) {
            text += tjMatch[2] + " ";
          }
        }
      } catch {
        // Plain uncompressed stream fallback
        const plainMatches = streamData.match(/\((.*?)\)\s*Tj/g);
        if (plainMatches) {
          text += plainMatches.map((m) => m.replace(/[()]/g, "").replace(/\s*Tj$/, "")).join(" ") + " ";
        }
      }
    }

    return text.trim();
  } catch {
    return null;
  }
}

/**
 * Deterministic regex-based fallback extractor when LLM is unavailable.
 * Never fabricates data; only extracts existing matches.
 */
export function extractStructuredDataFallback(rawText: string): IParsedStructuredData {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Email extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Phone extraction
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // LinkedIn extraction
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0] : "";

  // GitHub extraction
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const github = githubMatch ? githubMatch[0] : "";

  // Portfolio extraction
  const portfolioMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:io|dev|me|com|org)(?:\/[^\s]*)?/i);
  const portfolio = portfolioMatch && portfolioMatch[0] !== linkedin && portfolioMatch[0] !== github ? portfolioMatch[0] : "";

  // Name heuristic: first non-empty line that does not look like a header or contact
  let full_name = "";
  for (const line of lines.slice(0, 5)) {
    if (!line.includes("@") && !line.includes("http") && line.length > 2 && line.length < 40 && !/resume|curriculum|vitae/i.test(line)) {
      full_name = line;
      break;
    }
  }

  // Common technical & professional skill keywords
  const COMMON_SKILLS = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#", "Go", "Rust",
    "SQL", "PostgreSQL", "MongoDB", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "HTML", "CSS", "TailwindCSS", "Next.js", "Express", "GraphQL", "REST APIs", "Git", "CI/CD",
    "Agile", "Scrum", "Linux", "Machine Learning", "Data Analysis", "Figma", "Problem Solving",
    "Leadership", "Communication", "Project Management", "Time Management", "Collaboration", "Strategic Planning"
  ];

  const lowerText = rawText.toLowerCase();
  const matchedHard: string[] = [];
  const matchedSoft: string[] = [];

  const softKeywords = ["communication", "leadership", "problem solving", "time management", "collaboration", "teamwork", "adaptability", "critical thinking"];

  for (const skill of COMMON_SKILLS) {
    if (lowerText.includes(skill.toLowerCase())) {
      if (softKeywords.includes(skill.toLowerCase())) {
        matchedSoft.push(skill);
      } else {
        matchedHard.push(skill);
      }
    }
  }

  // Summary extraction: first paragraph or section marked Summary / Objective
  let summary = "";
  const summaryMatch = rawText.match(/(?:summary|professional summary|about me|profile|objective)[\s:]*([\s\S]*?)(?=(?:experience|education|skills|projects|certifications|$))/i);
  if (summaryMatch && summaryMatch[1]) {
    const candidate = summaryMatch[1].trim().split(/\n\s*\n/)[0];
    if (candidate) {
      summary = candidate.replace(/\s+/g, " ").slice(0, 500);
    }
  } else if (lines.length > 3) {
    // Take second or third line if it looks like a summary sentence
    const candidate = lines.slice(1, 4).find((l) => l.length > 60);
    if (candidate) summary = candidate;
  }

  // Extract Experience heuristically
  const experience: IParsedStructuredData["experience"] = [];
  const expSection = rawText.match(
    /(?:experience|work experience|employment history)[\s:\r\n]+([\s\S]*?)(?=\n\s*(?:education|skills|projects|certifications)\b|$)/i
  );
  if (expSection && expSection[1]) {
    const expLines = expSection[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentRole = "";
    let currentCompany = "";
    let currentDates = "";
    let responsibilities: string[] = [];

    for (const line of expLines) {
      if (/^[•\-*▪›]/.test(line)) {
        responsibilities.push(line.replace(/^[•\-*▪›]\s*/, ""));
      } else if (/\b(19\d\d|20\d\d|present)\b/i.test(line)) {
        currentDates = line;
      } else if (!currentRole) {
        currentRole = line;
      } else if (!currentCompany) {
        currentCompany = line;
      }
    }
    if (currentRole || currentCompany) {
      experience.push({
        company: currentCompany || "Organization",
        position: currentRole || "Professional",
        dates: currentDates || "Present",
        responsibilities: responsibilities.slice(0, 5),
        achievements: [],
      });
    }
  }

  // Extract Education heuristically
  const education: IParsedStructuredData["education"] = [];
  const eduSection = rawText.match(
    /(?:education|academic history)[\s:\r\n]+([\s\S]*?)(?=\n\s*(?:experience|skills|projects|certifications)\b|$)/i
  );
  if (eduSection && eduSection[1]) {
    const eduLines = eduSection[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let institution = "";
    let degree = "";
    let graduation_year = "";

    for (const line of eduLines) {
      const yearMatch = line.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch && !graduation_year) {
        graduation_year = yearMatch[0];
      }
      if (/degree|bachelor|master|phd|bs|ba|b\.s|m\.s|diploma/i.test(line)) {
        degree = line;
      } else if (/university|college|institute|school|academy/i.test(line)) {
        institution = line;
      } else if (!institution) {
        institution = line;
      }
    }

    if (institution || degree) {
      education.push({
        institution: institution || "University / College",
        degree: degree || "Degree Program",
        graduation_year,
      });
    }
  }

  return {
    full_name,
    email,
    phone,
    location: "",
    linkedin,
    github,
    portfolio,
    summary,
    hard_skills: Array.from(new Set(matchedHard)),
    soft_skills: Array.from(new Set(matchedSoft)),
    experience,
    education,
    projects: [],
    certifications: [],
    domain_specializations: matchedHard.length > 3 ? ["Technology & Software Development"] : [],
    languages: ["English"],
    accomplishments: [],
  };
}

/**
 * Parse resume text into validated structured JSON using LLM with deterministic fallback.
 */
export async function parseResumeWithAI(
  userId: string,
  rawText: string
): Promise<IParsedStructuredData> {
  const sanitized = sanitizeResumeText(rawText);
  const fallback = extractStructuredDataFallback(sanitized);

  const systemPrompt = `You are a world-class AI Career Architect and Resume Intelligence Engine.
Analyze the extracted resume text and convert it into a strictly structured JSON document.
Rules:
1. NEVER invent, fabricate, or assume qualifications, dates, metrics, employers, or institutions not present in the text.
2. If an item is missing or not provided, return an empty string or empty array.
3. Separate hard skills (technical, tools, frameworks, methodologies) into hard_skills, and soft skills into soft_skills.
4. Extract all technical and professional skills mentioned in the resume into hard_skills.
5. Return ONLY a valid JSON object strictly matching this shape:
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "summary": "string",
  "hard_skills": ["string"],
  "soft_skills": ["string"],
  "experience": [{ "company": "string", "position": "string", "dates": "string", "responsibilities": ["string"], "achievements": ["string"] }],
  "education": [{ "institution": "string", "degree": "string", "graduation_year": "string", "details": "string" }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"], "measurable_outcomes": "string", "link": "string" }],
  "certifications": [{ "name": "string", "issuer": "string", "date": "string" }],
  "domain_specializations": ["string"],
  "languages": ["string"],
  "accomplishments": ["string"]
}`;

  const userPrompt = `Extract the structured resume data from this resume text:
--- BEGIN RESUME TEXT ---
${sanitized.slice(0, 12000)}
--- END RESUME TEXT ---`;

  const { data } = await askJson(
    userId,
    "resume_parse",
    parsedResumeSchema,
    systemPrompt,
    userPrompt,
    fallback
  );

  // Merge any fields that the LLM left empty if the deterministic fallback captured them
  const merged: IParsedStructuredData = {
    ...data,
    full_name: data.full_name || fallback.full_name || "",
    email: data.email || fallback.email || "",
    phone: data.phone || fallback.phone || "",
    location: data.location || fallback.location || "",
    linkedin: data.linkedin || fallback.linkedin || "",
    github: data.github || fallback.github || "",
    portfolio: data.portfolio || fallback.portfolio || "",
    summary: data.summary || fallback.summary || "",
    hard_skills: data.hard_skills && data.hard_skills.length > 0 ? data.hard_skills : fallback.hard_skills,
    soft_skills: data.soft_skills && data.soft_skills.length > 0 ? data.soft_skills : fallback.soft_skills,
    experience: data.experience && data.experience.length > 0 ? data.experience : fallback.experience,
    education: data.education && data.education.length > 0 ? data.education : fallback.education,
    projects: data.projects && data.projects.length > 0 ? data.projects : fallback.projects,
    certifications: data.certifications && data.certifications.length > 0 ? data.certifications : fallback.certifications,
    domain_specializations: data.domain_specializations && data.domain_specializations.length > 0 ? data.domain_specializations : fallback.domain_specializations,
    languages: data.languages && data.languages.length > 0 ? data.languages : fallback.languages,
    accomplishments: data.accomplishments && data.accomplishments.length > 0 ? data.accomplishments : fallback.accomplishments,
  };

  return merged;
}
