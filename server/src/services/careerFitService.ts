import { z } from "zod";
import { askJson } from "./ai";
import {
  IJobTarget,
  IScoreBreakdown,
  ITransferableSkill,
  IMissingSkill,
  IImprovementPlanStep,
  IRecommendedRole,
} from "../models/JobTarget";

export const evaluateFitInputSchema = z.object({
  target_role: z.string().min(1, "Target role is required").max(120),
  target_job_title: z.string().max(120).optional(),
  target_company: z.string().max(120).optional().default(""),
  job_description: z.string().max(15000).optional().default(""),
  industry: z.string().max(100).optional().default(""),
  parsed_resume_id: z.string().optional(),
  candidate_profile: z
    .object({
      full_name: z.string().optional(),
      summary: z.string().optional(),
      skills: z.array(z.string()).default([]),
      experience: z
        .array(
          z.object({
            company: z.string().optional().default(""),
            role: z.string().optional().default(""),
            position: z.string().optional().default(""),
            dates: z.string().optional().default(""),
            details: z.string().optional().default(""),
            responsibilities: z.array(z.string()).optional().default([]),
          })
        )
        .default([]),
      education: z
        .array(
          z.object({
            institution: z.string().optional().default(""),
            degree: z.string().optional().default(""),
            graduation_year: z.string().optional().default(""),
          })
        )
        .default([]),
      domain_specializations: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export type EvaluateFitInput = z.infer<typeof evaluateFitInputSchema>;

export const fitResultSchema = z.object({
  fitScore: z.number().min(0).max(100),
  fitCategory: z.enum([
    "Strong Fit",
    "Moderate Fit",
    "Partial Fit",
    "Significant Gap",
  ]),
  scoreBreakdown: z.object({
    skillScore: z.number().min(0).max(100),
    experienceScore: z.number().min(0).max(100),
    domainScore: z.number().min(0).max(100),
    weights: z.object({
      skills: z.number(),
      experience: z.number(),
      domain: z.number(),
    }),
  }),
  matchedSkills: z.array(z.string()),
  transferableSkills: z.array(
    z.object({
      skill: z.string(),
      relevance: z.string(),
      transferContext: z.string(),
    })
  ),
  missingSkills: z.array(
    z.object({
      skill: z.string(),
      priority: z.enum(["critical", "recommended", "nice-to-have"]),
      reason: z.string(),
    })
  ),
  experienceAlignment: z.string(),
  strengths: z.array(z.string()),
  improvementPlan: z.array(
    z.object({
      phase: z.string(),
      topic: z.string(),
      actions: z.array(z.string()),
      resources: z.array(z.string()),
    })
  ),
  recommendedRoles: z.array(
    z.object({
      role: z.string(),
      explanation: z.string(),
      matchScore: z.number().min(0).max(100),
    })
  ),
  careerAdvice: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  disclaimer: z.string(),
});

export type FitEvaluationResult = z.infer<typeof fitResultSchema>;

/**
 * Calculate Jaccard / Token similarity between two text / keyword sets
 */
function tokenSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()).filter(Boolean));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()).filter(Boolean));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Deterministic calibration engine to compute base scores and identify transferable vs missing skills.
 */
export function computeDeterministicFit(
  targetRole: string,
  jobDescription: string,
  candidateSkills: string[],
  experienceList: any[],
  domainSpecializations: string[]
): FitEvaluationResult {
  const roleLower = targetRole.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // Extract keywords from JD if available or use role keywords
  const candidateSkillsSet = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));

  // Role domain taxonomy
  const DOMAIN_MAP: Record<string, { core: string[]; transferable: string[]; alternativeRoles: string[] }> = {
    teacher: {
      core: [
        "Lesson Planning",
        "Classroom Management",
        "Curriculum Development",
        "Student Assessment",
        "Learning Outcomes",
        "Inclusive Education",
        "Parent Communication",
        "Educational Technology",
      ],
      transferable: ["Communication", "Presentation Skills", "Mentoring", "Planning", "Leadership"],
      alternativeRoles: ["Instructional Designer", "Academic Coordinator", "Corporate Trainer"],
    },
    trainer: {
      core: [
        "Instructional Design",
        "Workshop Facilitation",
        "Presentation Skills",
        "Learning Management Systems",
        "Curriculum Development",
        "Participant Engagement",
        "Assessment Design",
        "Coaching",
      ],
      transferable: ["Communication", "Mentoring", "Public Speaking", "Planning", "Leadership"],
      alternativeRoles: ["Learning Experience Designer", "Teacher", "Enablement Specialist"],
    },
    frontend: {
      core: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Next.js", "TailwindCSS", "State Management"],
      transferable: ["UI/UX Design", "REST APIs", "Git", "Problem Solving", "Web Performance"],
      alternativeRoles: ["UI Engineer", "Full Stack Developer", "Design Technologist"],
    },
    backend: {
      core: ["Node.js", "Python", "SQL", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "Database Design"],
      transferable: ["System Architecture", "Security", "CI/CD", "Cloud Infrastructure", "Unit Testing"],
      alternativeRoles: ["Platform Engineer", "API Specialist", "DevOps Engineer"],
    },
    "full stack": {
      core: ["React", "TypeScript", "Node.js", "SQL", "REST APIs", "Git", "MongoDB", "Express"],
      transferable: ["Cloud Services", "Agile Methodologies", "Debugging", "Product Management"],
      alternativeRoles: ["Software Engineer", "Technical Lead", "Solutions Architect"],
    },
    data: {
      core: ["Python", "SQL", "Pandas", "Data Analysis", "Tableau", "Statistics", "Data Pipelines"],
      transferable: ["Critical Thinking", "Visualization", "Business Acumen", "Excel", "Reporting"],
      alternativeRoles: ["Business Intelligence Analyst", "Data Engineer", "Analytics Consultant"],
    },
    management: {
      core: ["Leadership", "Project Management", "Agile", "Stakeholder Management", "Sprint Planning", "Roadmap Execution"],
      transferable: ["Communication", "Conflict Resolution", "Resource Allocation", "Team Mentorship"],
      alternativeRoles: ["Scrum Master", "Product Manager", "Operations Lead"],
    },
  };

  // Find matching domain key
  let matchedDomainKey = "full stack";
  if (/\bteach|teaching|educat|tutor|school|classroom|b\.?ed\b/.test(roleLower)) {
    matchedDomainKey = "teacher";
  } else if (/\btrain|trainer|coach|facilitat|instructional\b/.test(roleLower)) {
    matchedDomainKey = "trainer";
  }
  for (const key of Object.keys(DOMAIN_MAP)) {
    if (
      matchedDomainKey === "full stack" &&
      (roleLower.includes(key) || jdLower.includes(key))
    ) {
      matchedDomainKey = key;
      break;
    }
  }

  const domainData = DOMAIN_MAP[matchedDomainKey] || DOMAIN_MAP["full stack"]!;
  const targetRequired = domainData.core;

  const matchedSkills: string[] = [];
  const missingSkillsList: IMissingSkill[] = [];
  const transferableSkillsList: { skill: string; relevance: string; transferContext: string }[] = [];

  for (const req of targetRequired) {
    if (candidateSkillsSet.has(req.toLowerCase())) {
      matchedSkills.push(req);
    } else {
      missingSkillsList.push({
        skill: req,
        priority: missingSkillsList.length < 2 ? "critical" : "recommended",
        reason: `Standard expectation for ${targetRole} positions.`,
      });
    }
  }

  for (const t of domainData.transferable) {
    if (candidateSkillsSet.has(t.toLowerCase())) {
      transferableSkillsList.push({
        skill: t,
        relevance: "High transferable value",
        transferContext: `Directly leverages your existing ${t} capability in the ${targetRole} workflow.`,
      });
    }
  }

  // Calculate weighted score
  const skillRatio = targetRequired.length > 0 ? matchedSkills.length / targetRequired.length : 0.5;
  const skillScore = Math.min(100, Math.round(skillRatio * 100));

  const experienceScore = Math.min(
    100,
    experienceList.length > 0 ? Math.min(100, 45 + experienceList.length * 18) : 35
  );

  const domainScore = Math.min(
    100,
    domainSpecializations.some((d) => d.toLowerCase().includes(matchedDomainKey))
      ? 90
      : matchedSkills.length > 0
      ? 70
      : 40
  );

  // Weights: Skills 45%, Experience 35%, Domain 20%
  const weights = { skills: 0.45, experience: 0.35, domain: 0.2 };
  const rawFitScore = Math.round(
    skillScore * weights.skills +
      experienceScore * weights.experience +
      domainScore * weights.domain
  );
  const fitScore = Math.max(10, Math.min(98, rawFitScore));

  let fitCategory: FitEvaluationResult["fitCategory"] = "Moderate Fit";
  if (fitScore >= 80) fitCategory = "Strong Fit";
  else if (fitScore >= 60) fitCategory = "Moderate Fit";
  else if (fitScore >= 40) fitCategory = "Partial Fit";
  else fitCategory = "Significant Gap";

  const confidence: FitEvaluationResult["confidence"] =
    candidateSkills.length < 2 && experienceList.length === 0 ? "low" : "high";

  return {
    fitScore,
    fitCategory,
    scoreBreakdown: {
      skillScore,
      experienceScore,
      domainScore,
      weights,
    },
    matchedSkills,
    transferableSkills: transferableSkillsList,
    missingSkills: missingSkillsList,
    experienceAlignment:
      experienceList.length > 0
        ? `Candidate demonstrates ${experienceList.length} relevant historical professional roles with background applicable to ${targetRole}.`
        : `Candidate profile has limited recorded experience for ${targetRole}; highlight practical project evidence.`,
    strengths: [
      ...(matchedSkills.length
        ? [`Verified competency in foundational role competencies: ${matchedSkills.slice(0, 3).join(", ")}.`]
        : []),
      ...(transferableSkillsList.length
        ? [`Transferable versatility in ${transferableSkillsList.map((t) => t.skill).join(", ")}.`]
        : ["Adaptable foundation with high growth potential for targeted role requirements."]),
    ],
    improvementPlan: [
      {
        phase: "Phase 1: Foundation (Weeks 1-2)",
        topic: missingSkillsList[0]?.skill || "Core Domain Concepts",
        actions: [
          `Build hands-on sample implementations featuring ${missingSkillsList[0]?.skill || "modern frameworks"}.`,
          "Review industry standard architectural patterns and documentation.",
        ],
        resources: [
          "Official Technical Documentation & Interactive Sandboxes",
          "Open source starter templates and production examples",
        ],
      },
      {
        phase: "Phase 2: Portfolio Evidence (Weeks 3-4)",
        topic: missingSkillsList[1]?.skill || "Integration & Delivery",
        actions: [
          "Deploy a publicly visible end-to-end project demonstrating required skills.",
          "Document measurable outcomes and performance metrics in your resume bullets.",
        ],
        resources: [
          "GitHub Repositories with CI/CD deployment pipelines",
          "System design case studies and architectural retrospectives",
        ],
      },
      {
        phase: "Phase 3: Mastery & System Design (Weeks 5-6)",
        topic: missingSkillsList[2]?.skill || "Production Architecture & Performance",
        actions: [
          "Conduct mock architectural reviews and system design trade-off evaluations.",
          "Refine resume bullets adhering to Google XYZ formula with verified impact metrics.",
        ],
        resources: [
          "Production Architecture RFCs and Post-Mortems",
          "Nexa AI Mock Interview Technical Coaching",
        ],
      },
    ],
    recommendedRoles: domainData.alternativeRoles.map((r, i) => ({
      role: r,
      explanation: `Leverages your verified skills with high market demand and adjacent requirements.`,
      matchScore: Math.min(95, fitScore + (i === 0 ? 5 : -5)),
    })),
    careerAdvice:
      fitScore >= 75
        ? `You present a competitive profile for ${targetRole}. Focus on tailoring your resume bullets with concrete impact metrics (XYZ formula) and demonstrating ownership.`
        : `To transition into ${targetRole}, bridge the key missing prerequisites and emphasize transferable strengths from your prior background.`,
    confidence,
    disclaimer:
      "Evaluated using transparent multi-factor scoring (skills 45%, experience 35%, domain alignment 20%). Distinguishes verified profile records from inferred attributes.",
  };
}

/**
 * Evaluate domain fit using AI semantic comparison and calibrated deterministic fallback.
 */
export async function evaluateDomainFitWithAI(
  userId: string,
  input: EvaluateFitInput
): Promise<FitEvaluationResult> {
  const targetRole = input.target_job_title || input.target_role;
  const candidate = input.candidate_profile || {
    skills: [],
    experience: [],
    education: [],
    domain_specializations: [],
  };

  const deterministic = computeDeterministicFit(
    targetRole,
    input.job_description,
    candidate.skills || [],
    candidate.experience || [],
    candidate.domain_specializations || []
  );

  const systemPrompt = `You are a Principal AI Career Architect, Talent Intelligence Expert, and Senior Hiring Director.
Evaluate the candidate's verified profile against the target role and job description.
Rules:
1. Use weighted scoring: Skills 45%, Experience 35%, Domain alignment 20%. Fit score must be between 0 and 100.
2. Clearly distinguish verified profile evidence from inferred capabilities.
3. Do not assume a missing skill means the candidate cannot perform the role; identify transferable skills and realistic prerequisites.
4. Categorize missing skills by priority (critical, recommended, nice-to-have).
5. Infer the target domain from the role title and job description before selecting requirements. For teaching, education, training, healthcare, creative, or other non-technical roles, do not recommend software engineering skills unless the job description explicitly requires them.
6. Treat education such as B.Ed, teaching practice, lesson planning, classroom exposure, curriculum work, and learner assessment as relevant evidence for teaching roles.
7. If the candidate has substantial experience in an adjacent domain, explain transferable skills honestly without exaggerating or recommending unwarranted career restarts.
8. If the profile has minimal data (low confidence), indicate confidence = "low" and provide helpful guidance.
9. Return ONLY valid JSON matching this exact structure:
{
  "fitScore": 75,
  "fitCategory": "Strong Fit",
  "scoreBreakdown": {
    "skillScore": 75,
    "experienceScore": 70,
    "domainScore": 80,
    "weights": { "skills": 0.45, "experience": 0.35, "domain": 0.20 }
  },
  "matchedSkills": ["string"],
  "transferableSkills": [{ "skill": "string", "relevance": "string", "transferContext": "string" }],
  "missingSkills": [{ "skill": "string", "priority": "critical", "reason": "string" }],
  "experienceAlignment": "string",
  "strengths": ["string"],
  "improvementPlan": [{ "phase": "string", "topic": "string", "actions": ["string"], "resources": ["string"] }],
  "recommendedRoles": [{ "role": "string", "explanation": "string", "matchScore": 80 }],
  "careerAdvice": "string",
  "confidence": "high",
  "disclaimer": "string"
}`;

  const userPrompt = `Target Role: ${targetRole}
Target Industry: ${input.industry || "General Industry"}
Job Description:
${input.job_description ? input.job_description.slice(0, 4000) : "Standard industry requirements for " + targetRole}

Candidate Profile:
Name: ${candidate.full_name || "Candidate"}
Summary: ${candidate.summary || "Not specified"}
Skills: ${(candidate.skills || []).join(", ") || "None listed"}
Experience: ${JSON.stringify(candidate.experience || [])}
Education: ${JSON.stringify(candidate.education || [])}
Domain Specializations: ${(candidate.domain_specializations || []).join(", ") || "General"}`;

  const { data } = await askJson(
    userId,
    "career_fit_evaluation",
    fitResultSchema,
    systemPrompt,
    userPrompt,
    deterministic
  );

  return data;
}
