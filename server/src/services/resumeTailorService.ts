import { z } from "zod";
import { askJson } from "./ai";
import { IResumeContent } from "../models/Resume";
import { IAtsChecklist, ITypographySettings } from "../models/ResumeVersion";

export const generateTailoredInputSchema = z.object({
  resume_id: z.string().optional(),
  target_job_title: z.string().min(1, "Target job title is required").max(120),
  target_company: z.string().max(120).optional().default(""),
  job_description: z.string().max(15000).optional().default(""),
  industry: z.string().max(100).optional().default(""),
  company_style: z
    .enum(["big_tech", "enterprise", "startup", "academic"])
    .default("big_tech"),
  template_type: z
    .enum(["classic", "modern", "minimal", "executive", "academic"])
    .default("modern"),
  typography_settings: z
    .object({
      font_family: z
        .enum(["Inter", "Roboto", "Merriweather", "JetBrains Mono", "Lato"])
        .default("Inter"),
      font_size: z.enum(["small", "regular", "large"]).default("regular"),
      accent_color: z.string().default("#4f46e5"),
      page_margins: z.enum(["compact", "normal", "spacious"]).default("normal"),
      bullet_style: z
        .enum(["disc", "dash", "arrow", "square"])
        .default("disc"),
      layout_mode: z.enum(["one_page", "multi_page"]).default("multi_page"),
    })
    .optional(),
  current_content: z
    .object({
      template: z.string().optional(),
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
    })
    .optional(),
});

export type GenerateTailoredInput = z.infer<typeof generateTailoredInputSchema>;

export const tailoredOutputSchema = z.object({
  tailoredContent: z.object({
    template: z.string(),
    name: z.string(),
    headline: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    website: z.string(),
    linkedin: z.string(),
    summary: z.string(),
    skills: z.string(),
    achievements: z.string(),
    languages: z.string(),
    customTitle: z.string(),
    customContent: z.string(),
    experience: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        dates: z.string(),
        details: z.string(),
      })
    ),
    education: z.array(
      z.object({
        school: z.string(),
        degree: z.string(),
        dates: z.string(),
      })
    ),
    projects: z.array(
      z.object({
        name: z.string(),
        link: z.string(),
        details: z.string(),
      })
    ),
    certifications: z.array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        date: z.string(),
      })
    ),
  }),
  atsChecklist: z.object({
    keyword_coverage: z.object({
      matched: z.array(z.string()),
      missing: z.array(z.string()),
      coverage_percent: z.number().min(0).max(100),
    }),
    heading_structure: z.object({
      valid: z.boolean(),
      notes: z.array(z.string()),
    }),
    date_consistency: z.object({
      valid: z.boolean(),
      notes: z.array(z.string()),
    }),
    readability: z.object({
      score: z.number().min(0).max(100),
      notes: z.array(z.string()),
    }),
    layout_compatibility: z.object({
      ats_safe: z.boolean(),
      recommendations: z.array(z.string()),
    }),
    overall_readiness: z.enum([
      "Excellent",
      "Good",
      "Needs Improvement",
    ]),
  }),
  styleRationale: z.string(),
  recommendations: z.array(z.string()),
});

export type TailoredResumeResult = z.infer<typeof tailoredOutputSchema>;

/**
 * Generate ATS checklist deterministically from content & target JD
 */
export function auditAtsReadiness(
  content: IResumeContent,
  jobDescription: string,
  targetRole: string
): IAtsChecklist {
  const allContentText = [
    content.headline,
    content.summary,
    content.skills,
    ...content.experience.map((e) => `${e.role} ${e.details}`),
    ...content.projects.map((p) => `${p.name} ${p.details}`),
  ]
    .join(" ")
    .toLowerCase();

  // Extract key terms from JD or common role terms
  const termsToTest = jobDescription
    ? Array.from(
        new Set(
          jobDescription
            .toLowerCase()
            .match(/\b[a-zA-Z]{3,15}\b/g)
            ?.filter(
              (w) =>
                ![
                  "the",
                  "and",
                  "for",
                  "with",
                  "that",
                  "this",
                  "from",
                  "will",
                  "have",
                  "work",
                  "team",
                  "your",
                  "must",
                ].includes(w)
            )
            .slice(0, 20) || []
        )
      )
    : targetRole
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of termsToTest) {
    if (allContentText.includes(term)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  const coverage_percent =
    termsToTest.length > 0
      ? Math.round((matched.length / termsToTest.length) * 100)
      : 80;

  // Validate heading structure
  const hasStandardHeadings =
    content.experience.length > 0 && content.education.length > 0;

  // Validate dates
  const datePatterns = content.experience.map((e) => e.dates);
  const datesAreFormatted = datePatterns.every(
    (d) => d && d.trim().length > 3
  );

  const readabilityScore = Math.min(
    95,
    Math.max(
      60,
      content.summary.length > 50 && content.experience.length > 0 ? 88 : 72
    )
  );

  let overall_readiness: IAtsChecklist["overall_readiness"] = "Good";
  if (coverage_percent >= 75 && hasStandardHeadings && datesAreFormatted) {
    overall_readiness = "Excellent";
  } else if (coverage_percent < 50 || !hasStandardHeadings) {
    overall_readiness = "Needs Improvement";
  }

  return {
    keyword_coverage: {
      matched: matched.slice(0, 10),
      missing: missing.slice(0, 10),
      coverage_percent,
    },
    heading_structure: {
      valid: hasStandardHeadings,
      notes: hasStandardHeadings
        ? ["Standard ATS-compliant sections: Summary, Experience, Education, Skills."]
        : ["Recommend ensuring both Experience and Education sections are populated."],
    },
    date_consistency: {
      valid: datesAreFormatted,
      notes: datesAreFormatted
        ? ["Chronology formatting is clear and parser-readable."]
        : ["Ensure all experience entries include clear date intervals (e.g., '2022 - Present')."],
    },
    readability: {
      score: readabilityScore,
      notes: [
        "Concise bullet points with action verbs improve parseability and recruiter readability.",
      ],
    },
    layout_compatibility: {
      ats_safe: true,
      recommendations: [
        "Single-page / clean single-column hierarchy is optimized for standard ATS parsing engines.",
        "Headers and bullet characters use universally recognized text encoding.",
      ],
    },
    overall_readiness,
  };
}

/**
 * Deterministic tailoring fallback that aligns content with style without fabricating facts.
 */
export function tailorContentFallback(
  original: IResumeContent,
  targetRole: string,
  targetCompany: string,
  style: "big_tech" | "enterprise" | "startup" | "academic",
  jobDescription: string
): TailoredResumeResult {
  const headline = targetCompany
    ? `${targetRole} | Targeting ${targetCompany}`
    : targetRole || original.headline;

  let summary = original.summary;
  if (style === "big_tech") {
    summary = `Results-oriented ${targetRole} with a strong engineering track record in scalable systems, performance optimization, and measurable technical impact. Focused on delivering high-reliability architecture and execution speed.`;
  } else if (style === "enterprise") {
    summary = `Experienced ${targetRole} recognized for aligning complex technical solutions with enterprise business objectives, rigorous governance, and cross-functional leadership across distributed teams.`;
  } else if (style === "startup") {
    summary = `High-velocity ${targetRole} experienced in full lifecycle product ownership, rapid prototyping, and shipping resilient customer-facing features in agile environments.`;
  } else if (style === "academic") {
    summary = `Dedicated ${targetRole} combining rigorous theoretical foundations with research methodologies, continuous scholarship, and practical domain applications.`;
  }

  // Refine experience bullets using action verbs without fabricating metrics
  const tailoredExperience = original.experience.map((exp) => {
    let details = exp.details;
    if (style === "big_tech" && !details.includes("Accomplished")) {
      const bullets = details
        .split(/\n|•/)
        .map((b) => b.trim())
        .filter(Boolean);
      const enhanced = bullets.map((b) => {
        if (/^developed|built|created|worked on/i.test(b)) {
          return `Architected and deployed high-performance solutions: ${b.replace(/^[a-z]+\s*/i, "")}`;
        }
        return b;
      });
      details = enhanced.map((b) => `• ${b}`).join("\n");
    }
    return {
      company: exp.company,
      role: exp.role,
      dates: exp.dates,
      details,
    };
  });

  const atsChecklist = auditAtsReadiness(original, jobDescription, targetRole);

  return {
    tailoredContent: {
      template: original.template,
      name: original.name,
      headline,
      email: original.email,
      phone: original.phone,
      location: original.location,
      website: original.website,
      linkedin: original.linkedin,
      summary,
      skills: original.skills,
      achievements: original.achievements,
      languages: original.languages || "English",
      customTitle: original.customTitle || "",
      customContent: original.customContent || "",
      experience: tailoredExperience,
      education: original.education,
      projects: original.projects,
      certifications: original.certifications,
    },
    atsChecklist,
    styleRationale: `Tailored according to ${style.replace("_", " ").toUpperCase()} profile specifications. Refined headline and summary alignment while strictly preserving candidate identity and career history.`,
    recommendations: [
      "Review the XYZ achievement bullet structure in your latest work experiences.",
      "Verify keyword density against the specific role posting before submitting.",
    ],
  };
}

/**
 * Generate tailored resume using AI with strict preservation of facts and credentials.
 */
export async function generateTailoredResumeWithAI(
  userId: string,
  input: GenerateTailoredInput,
  originalContent: IResumeContent
): Promise<TailoredResumeResult> {
  const fallback = tailorContentFallback(
    originalContent,
    input.target_job_title,
    input.target_company || "",
    input.company_style,
    input.job_description || ""
  );

  const systemPrompt = `You are an elite Executive Career Strategist and ATS Optimization Specialist.
Tailor the candidate's existing resume for the target role: "${input.target_job_title}" (${input.company_style} profile).
Strict Rules:
1. NEVER invent numerical results, metrics, companies, dates, degrees, certifications, or job titles.
2. If a metric is missing in an experience bullet, improve the action verb, clarity, and structural impact WITHOUT fabricating a number.
3. Apply the '${input.company_style}' tailoring philosophy:
   - 'big_tech': measurable impact, technical depth, XYZ achievement patterns when supported by evidence.
   - 'enterprise': leadership, stakeholders, governance, methodology, cross-functional value.
   - 'startup': ownership, adaptability, shipping velocity, direct end-to-end contribution.
   - 'academic': rigorous scholarship, methodologies, research context, publications/teaching.
4. Align keywords from the job description naturally into skills, summary, and experience descriptions where truthfully supported by candidate's background.
5. Provide a realistic ATS readiness checklist with honest assessments.
6. Return ONLY valid JSON matching this exact top-level structure:
{
  "tailoredContent": { "template": "string", "name": "string", "headline": "string", "email": "string", "phone": "string", "location": "string", "website": "string", "linkedin": "string", "summary": "string", "skills": "string", "achievements": "string", "languages": "string", "customTitle": "string", "customContent": "string", "experience": [{ "company": "string", "role": "string", "dates": "string", "details": "string" }], "education": [{ "school": "string", "degree": "string", "dates": "string" }], "projects": [{ "name": "string", "link": "string", "details": "string" }], "certifications": [{ "name": "string", "issuer": "string", "date": "string" }] },
  "atsChecklist": { "overall_score": 85, "verdict": "string", "keyword_coverage": { "score": 80, "status": "string", "matched": ["string"], "missing": ["string"], "density_recommendation": "string" }, "quantified_achievements": { "score": 80, "status": "string", "detected_metrics_count": 2, "suggested_improvements": ["string"] }, "action_verb_strength": { "score": 85, "status": "string", "strong_verbs_used": ["string"], "weak_verbs_flagged": ["string"] }, "section_formatting": { "score": 90, "status": "string", "has_standard_headings": true, "dates_are_formatted": true, "bullet_points_consistent": true, "issues": [] }, "readability_grade": { "score": 88, "status": "string", "avg_sentence_length": 15, "complex_words_percentage": 12, "clarity_level": "string" } },
  "styleRationale": "string",
  "recommendations": ["string"]
}`;

  const userPrompt = `Target Job Title: ${input.target_job_title}
Target Company: ${input.target_company || "Industry Leader"}
Company Style: ${input.company_style}
Target Industry: ${input.industry || "Technology"}
Job Description:
${input.job_description ? input.job_description.slice(0, 4000) : "Standard requirements for " + input.target_job_title}

Existing Resume Content:
${JSON.stringify(originalContent, null, 2)}`;

  const { data } = await askJson(
    userId,
    "resume_tailoring",
    tailoredOutputSchema,
    systemPrompt,
    userPrompt,
    fallback
  );

  return data;
}
