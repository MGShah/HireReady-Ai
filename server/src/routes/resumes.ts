import { Router, Request } from "express";
import { env } from "../env";
import multer from "multer";
import { z } from "zod";
import { Resume, IResumeContent } from "../models/Resume";
import { Profile } from "../models/Profile";
import { ParsedResume } from "../models/ParsedResume";
import { ResumeVersion } from "../models/ResumeVersion";
import { ah, AppError } from "../middleware/error";
import { askJson } from "../services/ai";
import {
  generateResumeSummaries,
  generateResumeBullets,
  reviewResumeATS,
} from "../services/aiIntelligence";
import {
  extractTextFromFile,
  parseResumeWithAI,
  parsedResumeSchema,
} from "../services/resumeParser";
import {
  generateTailoredInputSchema,
  generateTailoredResumeWithAI,
} from "../services/resumeTailorService";
import { generateResumePdfBuffer } from "../services/pdfExportService";
import { calculateProfileScore } from "./profile";

export const resumeRouter = Router();

// Configure safe in-memory upload (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const allowedExts = [".pdf", ".docx", ".doc"];
    const ext = "." + (file.originalname.split(".").pop() || "").toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          "Invalid file format. Only PDF and DOCX files are supported."
        )
      );
    }
  },
});

export const resumeSchema = z.object({
  template: z
    .enum(["classic", "modern", "minimal", "executive", "academic"])
    .default("classic"),
  name: z.string().default(""),
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().default(""),
  linkedin: z.string().default(""),
  summary: z.string().default(""),
  skills: z.string().default(""),
  achievements: z.string().default(""),
  languages: z.string().default("English"),
  customTitle: z.string().default(""),
  customContent: z.string().default(""),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        dates: z.string().default(""),
        details: z.string().default(""),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().default(""),
        degree: z.string().default(""),
        dates: z.string().default(""),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        link: z.string().default(""),
        details: z.string().default(""),
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
});

// ----------------------------------------------------
// 1. GET & PUT Current Active Resume
// ----------------------------------------------------
resumeRouter.get(
  "/",
  ah(async (req, res) => {
    const userId = req.user!.id;
    let resumeDoc = await Resume.findOne({ user_id: userId }).lean();

    if (!resumeDoc) {
      // Build from profile if exists
      const profile = await Profile.findOne({ user_id: userId }).lean();
      const defaultContent = {
        template: "classic" as const,
        name: profile?.full_name || "",
        headline: profile?.target_role || "",
        email: req.user!.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        website: profile?.website || "",
        linkedin: profile?.linkedin || "",
        summary: profile?.summary || "",
        skills: profile?.skills?.join(", ") || "",
        achievements: "",
        languages: "English",
        customTitle: "",
        customContent: "",
        experience: [
          {
            company: "",
            role: profile?.target_role || "Recent Role",
            dates: "Present",
            details: "Key achievements, responsibilities, and delivered projects.",
          },
        ],
        education: [
          {
            school: profile?.college || "University / College",
            degree: profile?.education || "Degree / Program",
            dates: profile?.graduation_year
              ? String(profile?.graduation_year)
              : "Graduation Year",
          },
        ],
        projects: [],
        certifications: [],
      };

      resumeDoc = await Resume.create({
        user_id: userId,
        content: defaultContent,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    res.json(resumeDoc.content);
  })
);

resumeRouter.put(
  "/",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const content = resumeSchema.parse(req.body);
    const now = new Date();

    const resumeDoc = await Resume.findOneAndUpdate(
      { user_id: userId },
      {
        content,
        updated_at: now,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const firstEducation = content.education[0];
    const graduationMatch = firstEducation?.dates?.match(/\b(19|20)\d{2}\b/);
    const graduationYear = graduationMatch ? Number(graduationMatch[0]) : null;
    const profileUpdates = {
      full_name: content.name,
      target_role: content.headline,
      location: content.location,
      phone: content.phone,
      linkedin: content.linkedin,
      website: content.website,
      summary: content.summary,
      skills: content.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      college: firstEducation?.school ?? "",
      education: firstEducation?.degree ?? "",
      graduation_year: graduationYear,
      updated_at: now,
    };
    const existingProfile = await Profile.findOne({ user_id: userId }).lean();
    const mergedProfile = { ...(existingProfile || {}), ...profileUpdates };

    await Profile.findOneAndUpdate(
      { user_id: userId },
      {
        ...profileUpdates,
        profile_completion_percentage: calculateProfileScore(mergedProfile),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.json(resumeDoc.content);
  })
);

// ----------------------------------------------------
// 2. Smart Resume Parsing (PDF & DOCX)
// ----------------------------------------------------
resumeRouter.post(
  "/parse",
  upload.single("file"),
  ah(async (req: Request, res) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file || !file.buffer) {
      throw new AppError(400, "Please upload a resume file (PDF or DOCX).");
    }

    // 1. Text Extraction
    const { text, isScannedPdf } = await extractTextFromFile(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    let warnings: string[] = [];
    if (isScannedPdf) {
      warnings.push(
        "Detected scanned document with minimal text. For optimal parsing accuracy, please use a searchable text PDF or DOCX."
      );
    }

    // 2. AI Structured Extraction
    const structuredData = await parseResumeWithAI(userId, text);

    // 3. Save to ParsedResume logical collection
    const parsedDoc = await ParsedResume.create({
      user_id: userId,
      original_filename: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      storage_reference: `safe_mem://${userId}/${Date.now()}_${file.originalname}`,
      extracted_text: text.slice(0, 50000), // bounded storage
      structured_data: structuredData,
      parser_version: "2.0.0",
      parsing_status: "completed",
      is_scanned_pdf: isScannedPdf,
      extraction_errors: warnings,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      parsedResumeId: parsedDoc._id.toString(),
      structuredData,
      isScannedPdf,
      warnings,
      rawTextSnippet: text.slice(0, 300),
    });
  })
);

// ----------------------------------------------------
// 3. User Review Confirmation & Profile Update
// ----------------------------------------------------
const confirmParsedSchema = z.object({
  parsedResumeId: z.string().optional(),
  updateProfile: z.boolean().default(true),
  updateResumeBuilder: z.boolean().default(true),
  confirmedData: parsedResumeSchema,
});

resumeRouter.post(
  "/confirm-parsed",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const { updateProfile, updateResumeBuilder, confirmedData } =
      confirmParsedSchema.parse(req.body);

    const now = new Date();

    // 1. Update Profile if confirmed
    let updatedProfile = null;
    if (updateProfile) {
      const skillsCombined = Array.from(
        new Set([...confirmedData.hard_skills, ...confirmedData.soft_skills])
      );

      updatedProfile = await Profile.findOneAndUpdate(
        { user_id: userId },
        {
          full_name: confirmedData.full_name || undefined,
          target_role:
            confirmedData.experience[0]?.position || undefined,
          phone: confirmedData.phone || undefined,
          location: confirmedData.location || undefined,
          linkedin: confirmedData.linkedin || undefined,
          github: confirmedData.github || undefined,
          portfolio: confirmedData.portfolio || undefined,
          website: confirmedData.portfolio || confirmedData.linkedin || undefined,
          summary: confirmedData.summary || undefined,
          skills: skillsCombined,
          domain_specializations: confirmedData.domain_specializations,
          languages: confirmedData.languages,
          accomplishments: confirmedData.accomplishments,
          certifications: confirmedData.certifications.map((c) => ({
            name: c.name,
            issuer: c.issuer,
            date: c.date,
          })),
          ...(confirmedData.education[0]?.institution
            ? { college: confirmedData.education[0].institution }
            : {}),
          ...(confirmedData.education[0]?.degree
            ? { education: confirmedData.education[0].degree }
            : {}),
          ...(confirmedData.education[0]?.graduation_year
            ? {
                graduation_year: parseInt(
                  confirmedData.education[0].graduation_year.replace(/\D/g, "")
                ) || undefined,
              }
            : {}),
          updated_at: now,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );

      if (updatedProfile) {
        updatedProfile.profile_completion_percentage = calculateProfileScore(updatedProfile);
        await updatedProfile.save();
      }
    }

    // 2. Update Active Resume Builder if confirmed
    let updatedResume = null;
    if (updateResumeBuilder) {
      const resumeContent: IResumeContent = {
        template: "modern",
        name: confirmedData.full_name,
        headline: confirmedData.experience[0]?.position || "",
        email: confirmedData.email || req.user!.email || "",
        phone: confirmedData.phone,
        location: confirmedData.location,
        website: confirmedData.portfolio || "",
        linkedin: confirmedData.linkedin,
        summary: confirmedData.summary,
        skills: [
          ...confirmedData.hard_skills,
          ...confirmedData.soft_skills,
        ].join(", "),
        achievements: confirmedData.accomplishments.join("\n"),
        languages: confirmedData.languages.join(", ") || "English",
        customTitle: "",
        customContent: "",
        experience: confirmedData.experience.map((exp) => ({
          company: exp.company,
          role: exp.position,
          dates: exp.dates,
          details: [
            ...exp.responsibilities,
            ...exp.achievements.map((a) => `Accomplished: ${a}`),
          ]
            .map((item) => `• ${item}`)
            .join("\n"),
        })),
        education: confirmedData.education.map((edu) => ({
          school: edu.institution,
          degree: edu.degree,
          dates: edu.graduation_year,
        })),
        projects: confirmedData.projects.map((p) => ({
          name: p.name,
          link: p.link || "",
          details: `${p.description} (${p.technologies.join(", ")}) ${
            p.measurable_outcomes ? "Impact: " + p.measurable_outcomes : ""
          }`.trim(),
        })),
        certifications: confirmedData.certifications.map((c) => ({
          name: c.name,
          issuer: c.issuer,
          date: c.date,
        })),
      };

      updatedResume = await Resume.findOneAndUpdate(
        { user_id: userId },
        {
          content: resumeContent,
          updated_at: now,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
    }

    res.json({
      success: true,
      message: "Information successfully confirmed and updated.",
      profile: updatedProfile,
      resume: updatedResume?.content,
    });
  })
);

// ----------------------------------------------------
// 4. AI-Powered Resume Tailoring
// ----------------------------------------------------
resumeRouter.post(
  "/generate-tailored",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const body = generateTailoredInputSchema.parse(req.body);

    // Get source resume content: either from request or user's active resume
    let originalContent: IResumeContent;
    if (body.current_content && body.current_content.name) {
      originalContent = body.current_content as IResumeContent;
    } else {
      const currentDoc = await Resume.findOne({ user_id: userId }).lean();
      if (!currentDoc) {
        throw new AppError(
          400,
          "No active resume found to tailor. Please build or upload a resume first."
        );
      }
      originalContent = currentDoc.content;
    }

    const tailoredResult = await generateTailoredResumeWithAI(
      userId,
      body,
      originalContent
    );

    // Save as new ResumeVersion
    const versionDoc = await ResumeVersion.create({
      user_id: userId,
      source_resume_id: body.resume_id || undefined,
      version_name: `${body.target_job_title} (${
        body.target_company || body.company_style
      })`,
      target_role: body.target_job_title,
      target_company: body.target_company || "",
      industry: body.industry || "",
      company_style: body.company_style,
      original_content: originalContent,
      tailored_content: tailoredResult.tailoredContent,
      template_type: body.template_type,
      typography_settings: body.typography_settings || {
        font_family: "Inter",
        font_size: "regular",
        accent_color: "#4f46e5",
        page_margins: "normal",
        bullet_style: "disc",
        layout_mode: "multi_page",
      },
      ats_checklist: tailoredResult.atsChecklist,
      generation_metadata: {
        tailoring_model: env.AI_MODEL || "openai/gpt-oss-20b",
        prompt_version: "2.0",
        generated_at: new Date(),
      },
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      versionId: versionDoc._id.toString(),
      versionName: versionDoc.version_name,
      ...tailoredResult,
    });
  })
);

// ----------------------------------------------------
// 5. Resume Versions Management
// ----------------------------------------------------
resumeRouter.get(
  "/versions",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const versions: any[] = await ResumeVersion.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    res.json(
      versions.map((v) => ({
        id: v._id.toString(),
        version_name: v.version_name,
        target_role: v.target_role,
        target_company: v.target_company,
        company_style: v.company_style,
        overall_readiness: v.ats_checklist?.overall_readiness || "Good",
        created_at: v.created_at,
      }))
    );
  })
);

resumeRouter.get(
  "/versions/:id",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const version = await ResumeVersion.findOne({
      _id: req.params.id,
      user_id: userId,
    }).lean();

    if (!version) {
      throw new AppError(404, "Resume version not found");
    }

    res.json(version);
  })
);

resumeRouter.post(
  "/versions/:id/restore",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const version = await ResumeVersion.findOne({
      _id: req.params.id,
      user_id: userId,
    }).lean();

    if (!version) {
      throw new AppError(404, "Resume version not found");
    }

    // Set tailored content as user's current resume
    const updated = await Resume.findOneAndUpdate(
      { user_id: userId },
      {
        content: version.tailored_content,
        updated_at: new Date(),
      },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      message: `Restored version "${version.version_name}" as active resume.`,
      content: updated.content,
    });
  })
);

// ----------------------------------------------------
// 6. PDF Generation and Export
// ----------------------------------------------------
const exportSchema = z.object({
  content: resumeSchema.optional(),
  template: z
    .enum(["classic", "modern", "minimal", "executive", "academic"])
    .optional(),
  fontFamily: z
    .enum(["Inter", "Roboto", "Merriweather", "JetBrains Mono", "Lato"])
    .optional(),
  fontSize: z.enum(["small", "regular", "large"]).optional(),
  accentColor: z.string().optional(),
  marginOption: z.enum(["compact", "normal", "spacious"]).optional(),
  bulletStyle: z.enum(["disc", "dash", "arrow", "square"]).optional(),
});

resumeRouter.post(
  "/export",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const body = exportSchema.parse(req.body);

    let contentToExport: IResumeContent;
    if (body.content && body.content.name) {
      contentToExport = body.content as IResumeContent;
    } else {
      const currentDoc = await Resume.findOne({ user_id: userId }).lean();
      if (!currentDoc) {
        throw new AppError(404, "No resume content found to export.");
      }
      contentToExport = currentDoc.content;
    }

    const pdfBuffer = await generateResumePdfBuffer(contentToExport, {
      template: body.template || (contentToExport.template as any) || "modern",
      fontFamily: body.fontFamily,
      fontSize: body.fontSize,
      accentColor: body.accentColor,
      marginOption: body.marginOption,
      bulletStyle: body.bulletStyle,
    });

    const safeFilename = `${(contentToExport.name || "Resume")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  })
);

// ----------------------------------------------------
// 7. Existing AI Assistant Features (Summaries, Bullets, Review)
// ----------------------------------------------------
const aiSummarySchema = z.object({
  role: z.string().default("Software Engineer"),
  skills: z.string().default(""),
  currentSummary: z.string().optional(),
});

resumeRouter.post(
  "/ai-summary",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const body = aiSummarySchema.parse(req.body);

    const mock = generateResumeSummaries(
      body.role,
      body.skills,
      body.currentSummary
    );

    const { data } = await askJson(
      userId,
      "resume_summary",
      z.object({
        suggestions: z.array(
          z.object({
            title: z.string(),
            tag: z.string(),
            text: z.string(),
          })
        ),
      }),
      "You are an executive resume writer and ATS specialist for all industries. Generate 3 distinct, high-impact professional summary options tailored to the candidate's target role and skills.",
      `Role: ${body.role}\nSkills: ${
        body.skills || "modern tech stack"
      }\nCurrent Summary: ${body.currentSummary || "None"}`,
      mock
    );

    res.json(data);
  })
);

const aiBulletsSchema = z.object({
  role: z.string().default("Software Engineer"),
  company: z.string().default("Tech Corp"),
  rawDetails: z.string().optional(),
  skills: z.string().optional(),
});

resumeRouter.post(
  "/ai-bullets",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const body = aiBulletsSchema.parse(req.body);

    const mock = generateResumeBullets(
      body.role,
      body.company,
      body.rawDetails,
      body.skills
    );

    const { data } = await askJson(
      userId,
      "resume_bullets",
      z.object({
        bullets: z.array(z.string()),
      }),
      "You are an elite resume coach for all industries. Generate 4 high-impact, ATS-optimized bullet points using strong action verbs and quantifiable outcomes.",
      `Role: ${body.role}\nCompany: ${body.company}\nDetails draft: ${
        body.rawDetails || "General duties"
      }\nKey skills: ${body.skills || ""}`,
      mock
    );

    res.json(data);
  })
);

resumeRouter.post(
  "/ai-review",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const resumeData = req.body;

    const mock = reviewResumeATS(resumeData);

    const { data } = await askJson(
      userId,
      "resume_review",
      z.object({
        atsScore: z.number(),
        verdict: z.string(),
        strengths: z.array(z.string()),
        missingKeywords: z.array(z.string()),
        improvements: z.array(z.string()),
      }),
      "You are an ATS algorithm and senior recruiter. Audit the resume and return atsScore, verdict, strengths, missingKeywords, and improvements.",
      `Resume content:\nHeadline: ${resumeData?.headline}\nSummary: ${
        resumeData?.summary
      }\nSkills: ${resumeData?.skills}\nExperience: ${JSON.stringify(
        resumeData?.experience || []
      )}`,
      mock
    );

    res.json(data);
  })
);
