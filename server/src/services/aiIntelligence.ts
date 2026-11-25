export interface InterviewFeedback {
  correctness: number;
  relevance: number;
  clarity: number;
  missing: string[];
  example: string;
}

export interface InterviewEvalResult {
  feedback: InterviewFeedback;
  nextQuestion: string | null;
}

export interface AtsReviewResult {
  atsScore: number;
  verdict: string;
  strengths: string[];
  missingKeywords: string[];
  improvements: string[];
}

export interface ResumeBulletResult {
  bullets: string[];
}

export interface ResumeSummaryResult {
  suggestions: {
    title: string;
    text: string;
    tag: string;
  }[];
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  general: [
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Planning",
    "Organization",
    "Stakeholder Management",
    "Time Management",
    "Presentation Skills",
  ],
  "full stack": [
    "TypeScript",
    "React",
    "Node.js",
    "RESTful APIs",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "CI/CD",
    "State Management",
    "Microservices",
    "Redis",
    "Unit Testing",
  ],
  frontend: [
    "TypeScript",
    "React",
    "Next.js",
    "TailwindCSS",
    "Web Vitals",
    "Responsive Design",
    "Accessibility (a11y)",
    "State Management",
    "Performance Optimization",
    "Component Architecture",
  ],
  backend: [
    "Node.js",
    "Python",
    "Distributed Systems",
    "Database Indexing",
    "PostgreSQL",
    "Redis Caching",
    "Kafka/RabbitMQ",
    "API Security",
    "GraphQL",
    "Docker/Kubernetes",
  ],
  java: [
    "Java 17/21",
    "Spring Boot",
    "Hibernate / JPA",
    "Microservices",
    "Kafka",
    "JUnit / Mockito",
    "PostgreSQL",
    "Docker",
    "JVM Tuning",
    "Design Patterns",
  ],
  python: [
    "Python 3.12+",
    "FastAPI / Django",
    "AsyncIO",
    "SQLAlchemy",
    "Celery / Redis",
    "PyTest",
    "Data Pipelines",
    "REST APIs",
    "Docker",
    "Pandas",
  ],
  devops: [
    "Kubernetes",
    "Docker",
    "Terraform",
    "AWS / GCP",
    "CI/CD Pipelines",
    "Prometheus / Grafana",
    "Linux Systems",
    "Ansible",
    "Infrastructure as Code",
    "GitOps",
  ],
  qa: [
    "Selenium / Playwright",
    "Cypress",
    "Integration Testing",
    "API Testing (Postman)",
    "Test Automation Frameworks",
    "CI/CD Integration",
    "Performance Testing (k6)",
    "Bug Tracking",
  ],
  "data analyst": [
    "SQL / Advanced Queries",
    "Python / Pandas",
    "Tableau / PowerBI",
    "Data Modeling",
    "ETL Pipelines",
    "Statistical Analysis",
    "A/B Testing",
    "Data Warehousing",
  ],
  teacher: [
    "Lesson Planning",
    "Classroom Management",
    "Curriculum Development",
    "Student Assessment",
    "Learning Outcomes",
    "Public Speaking",
    "Parent Communication",
    "Educational Technology",
  ],
  trainer: [
    "Instructional Design",
    "Workshop Facilitation",
    "Presentation Skills",
    "Learning Management Systems",
    "Curriculum Development",
    "Participant Engagement",
    "Assessment Design",
    "Coaching",
  ],
  "project coordinator": [
    "Project Planning",
    "Meeting Coordination",
    "Stakeholder Communication",
    "Documentation",
    "Timeline Management",
    "Risk Tracking",
    "Cross-functional Collaboration",
    "Event Coordination",
  ],
  "hr": [
    "Candidate Screening",
    "Interview Coordination",
    "Employee Engagement",
    "Conflict Resolution",
    "Onboarding",
    "Stakeholder Communication",
    "HRIS",
    "Recruitment",
  ],
  "customer success": [
    "Client Relationship Management",
    "Customer Onboarding",
    "Product Training",
    "Renewal Management",
    "Issue Resolution",
    "Stakeholder Communication",
    "Customer Retention",
    "CRM",
  ],
  "content specialist": [
    "Content Strategy",
    "Copywriting",
    "Editing",
    "Storytelling",
    "SEO",
    "Social Media",
    "Audience Research",
    "Content Planning",
  ],
};

function getRoleKey(roleStr: string): string {
  const lower = (roleStr || "").toLowerCase();
  for (const key of Object.keys(ROLE_KEYWORDS)) {
    if (lower.includes(key)) return key;
  }
  if (/\bteach|educat|tutor|school|classroom/.test(lower)) return "teacher";
  if (/\btrain|coach|facilitat/.test(lower)) return "trainer";
  if (/\bmeet|coordinat|organ|plan|event/.test(lower)) return "project coordinator";
  if (/\bpeople|human resource|recruit|talent/.test(lower)) return "hr";
  if (/\bcustomer|client|support|account/.test(lower)) return "customer success";
  if (/\bcontent|writer|copy/.test(lower)) return "content specialist";
  return "general";
}

export function generateInterviewQuestion(
  role: string,
  type: string,
  difficulty: string
): string {
  const r = (role || "Software Engineer").trim();
  const d = (difficulty || "medium").toLowerCase();
  const t = (type || "technical").toLowerCase();
  const roleKey = getRoleKey(r);
  const checkpoints: string[] = ROLE_KEYWORDS[roleKey] ?? ROLE_KEYWORDS.general ?? [];
  const checkpointList = checkpoints.slice(0, 4).join(", ");

  const questions: Record<string, Record<string, string[]>> = {
    technical: {
      easy: [
        `As a ${r}, how do you explain the difference between synchronous and asynchronous operations, and when would you use each?`,
        `Can you describe how client-server communication works and how you structure standard RESTful HTTP status codes in a ${r} project?`,
        `How do you handle input validation and data sanitization to prevent security vulnerabilities like SQL injection or XSS?`,
      ],
      medium: [
        `Could you walk me through the architecture of a production ${r} application you built? How did you manage state, handle errors gracefully, and structure your database queries?`,
        `In a ${r} environment, how do you diagnose and resolve a severe performance bottleneck or memory leak under sudden traffic spikes?`,
        `How do you design an idempotent API endpoint, and what mechanisms would you put in place to prevent duplicate transactions?`,
      ],
      hard: [
        `Design a distributed, highly available service for a ${r} role that handles 100,000 concurrent requests per second. How do you handle cache invalidation, database sharding, and fault tolerance?`,
        `Suppose two microservices experience an intermittent network partition during a write operation. How do you ensure data consistency using Saga patterns or two-phase commits?`,
        `Explain how you would profile and optimize an application with unpredictable p99 latency spikes in production. What metrics and tracing tools would you inspect?`,
      ],
    },
    coding: {
      easy: [
        `Given a dataset or array, how would you deduplicate records and find the most frequent element with optimal time and space complexity?`,
        `How would you implement a function to validate whether a string with brackets and parentheses is balanced?`,
      ],
      medium: [
        `How would you implement an in-memory LRU (Least Recently Used) cache with O(1) get and put operations? Walk me through the data structures you would choose.`,
        `Explain how you would design an efficient search-as-you-type autocomplete service using a Trie data structure.`,
      ],
      hard: [
        `How would you design a distributed rate limiter supporting token bucket or sliding window algorithms across multiple application instances using Redis?`,
        `How would you implement a topological sort to resolve dependency resolution in a package manager or build tool?`,
      ],
    },
    project: {
      easy: [
        `Walk me through your favorite portfolio or open-source project. What inspired you to build it and what core technologies did you use?`,
      ],
      medium: [
        `Describe the most complex project on your resume. What was the core technical problem, what architectural choices did you make, and what was the quantifiable outcome?`,
      ],
      hard: [
        `Describe a project where you had to refactor a legacy monolithic codebase into modular services or modern frameworks without taking downtime. What was your migration strategy?`,
      ],
    },
  };

  const roleQuestions: Record<string, string[]> = {
    easy: [
      `For a ${r}, how would you demonstrate your working knowledge of ${checkpoints[0] ?? "the core role requirements"} in a real task?`,
      `What would good practice look like for ${checkpoints[1] ?? "a core responsibility"} in a ${r} role?`,
    ],
    medium: [
      `Walk me through how you would handle a realistic ${r} assignment involving ${checkpointList}. Explain your decisions and how you would verify the outcome.`,
      `A ${r} must deliver strong results across ${checkpoints[0] ?? "core responsibilities"} and ${checkpoints[1] ?? "quality standards"}. How would you plan, execute, and measure that work?`,
    ],
    hard: [
      `Design a complete approach for a challenging ${r} scenario involving ${checkpointList}. Explain constraints, trade-offs, quality checks, and the evidence you would produce.`,
      `How would you diagnose and improve weak results in ${checkpoints[0] ?? "a key responsibility"} while maintaining ${checkpoints[1] ?? "professional standards"}?`,
    ],
  };
  const fallbackQuestions = roleQuestions.medium ?? [];
  const pool = roleQuestions[d] ?? questions[t]?.[d] ?? fallbackQuestions;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? fallbackQuestions[0] ?? `Describe how you would perform the core responsibilities of a ${r} role.`;
}

export function evaluateInterviewAnswer(
  question: string,
  answer: string,
  role: string,
  isLast: boolean
): InterviewEvalResult {
  const ans = (answer || "").trim();
  const words = ans.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const targetKeywords: string[] = ROLE_KEYWORDS[getRoleKey(role)] ?? ROLE_KEYWORDS["full stack"] ?? [];
  const matchedKeywords = targetKeywords.filter((kw) =>
    ans.toLowerCase().includes(kw.toLowerCase())
  );

  let correctness = 6.5;
  let relevance = 7.0;
  let clarity = 7.0;

  // Evaluate based on depth and keyword substance
  if (wordCount < 20) {
    correctness = Math.max(4.0, 4.5 + Math.min(2.0, wordCount / 10));
    relevance = 6.0;
    clarity = 5.5;
  } else if (wordCount < 60) {
    correctness = Math.min(8.0, 6.0 + matchedKeywords.length * 0.5);
    relevance = 7.5;
    clarity = 7.2;
  } else {
    correctness = Math.min(9.5, 7.5 + matchedKeywords.length * 0.4);
    relevance = Math.min(9.8, 8.0 + (wordCount > 100 ? 0.8 : 0.4));
    clarity = Math.min(9.4, 7.8 + (ans.includes("\n") || ans.includes("-") ? 0.8 : 0.4));
  }

  // Format to 1 decimal place
  correctness = Math.round(correctness * 10) / 10;
  relevance = Math.round(relevance * 10) / 10;
  clarity = Math.round(clarity * 10) / 10;

  const missing: string[] = [];
  if (wordCount < 40) {
    missing.push(`Elaborate with concrete ${role || "role"} steps and a relevant example`);
  }
  if (!/\d|%|scale|latency|benchmark|users|ms|seconds/i.test(ans)) {
    missing.push("Include measurable outcomes, quality indicators, or evidence of impact");
  }
  if (!/trade-off|tradeoff|downside|alternative|challenge|edge case/i.test(ans)) {
    missing.push("Explain constraints, alternatives, risks, and how you would verify quality");
  }
  if (matchedKeywords.length < 2) {
    const unmentioned = targetKeywords.filter((k) => !matchedKeywords.includes(k)).slice(0, 3);
    missing.push(`Address role checkpoints such as ${unmentioned.join(", ")}`);
  }

  const example =
    `A strong ${role || "candidate"} answer would define the role task, explain the relevant steps and decisions, address constraints and quality checks, and finish with concrete evidence such as learner outcomes, delivery quality, accuracy, efficiency, or measurable impact.`;

  let nextQuestion: string | null = null;
  if (!isLast) {
    const followUps = [
      `What evidence would you use to show that your ${role || "role"} approach was effective?`,
      `What constraint or risk would you check first in that ${role || "role"} scenario, and how would you address it?`,
      `Which role-specific quality standard would you use to review the result?`,
      `What would you improve if the first outcome did not meet the expected ${role || "role"} standard?`,
    ];
    nextQuestion = followUps[Math.floor(Math.random() * followUps.length)]!;
  }

  return {
    feedback: {
      correctness,
      relevance,
      clarity,
      missing: missing.slice(0, 3),
      example,
    },
    nextQuestion,
  };
}

export function generateResumeSummaries(
  role: string,
  skills: string,
  existingSummary?: string
): ResumeSummaryResult {
  const r = role.trim() || "Professional";
  const skillList = skills
    ? skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5).join(", ")
    : "communication, planning, collaboration, and role-specific expertise";

  return {
    suggestions: [
      {
        title: "Results-Driven & Executive",
        tag: "High ATS Impact",
        text: `Results-driven ${r} with a track record of delivering meaningful outcomes through ${skillList}. Adept at collaborating with people, solving practical problems, and improving the quality and impact of everyday work.`,
      },
      {
        title: "Technical Specialist",
        tag: "Engineering Focused",
        text: `Innovative and detail-oriented ${r} specializing in ${skillList}. Known for thoughtful planning, clear communication, continuous improvement, and adapting effectively to the needs of teams and the people they serve.`,
      },
      {
        title: "Full-Lifecycle & Growth",
        tag: "Product & Impact",
        text: `Impact-focused ${r} combining strong knowledge of ${skillList} with practical problem-solving skills. Proven ability to turn goals into well-organized actions, build trust with stakeholders, and deliver measurable results.`,
      },
    ],
  };
}

export function generateResumeBullets(
  role: string,
  company: string,
  rawDetails?: string,
  skills?: string
): ResumeBulletResult {
  const r = role.trim() || "Professional";
  const c = company.trim() || "Tech Corp";

  return {
    bullets: [
      `Led ${r} responsibilities at ${c}, improving day-to-day outcomes through clear planning, consistent follow-through, and measurable progress.`,
      `Coordinated with stakeholders to deliver high-priority work on schedule, resolving blockers and improving communication across the team.`,
      `Applied ${skills || "role-specific expertise"} to improve quality, efficiency, and the experience of the people or customers served.`,
      `Documented key processes, results, and lessons learned to support continuous improvement and repeatable success.`,
    ],
  };
}

export function reviewResumeATS(resume: any): AtsReviewResult {
  let score = 65;
  const strengths: string[] = [];
  const improvements: string[] = [];

  const headline = resume?.headline || "";
  const summary = resume?.summary || "";
  const skills = resume?.skills || "";
  const experience = Array.isArray(resume?.experience) ? resume.experience : [];
  const education = Array.isArray(resume?.education) ? resume.education : [];
  const projects = Array.isArray(resume?.projects) ? resume.projects : [];
  const roleKey = getRoleKey(headline || resume?.name || "");
  const roleKeywords: string[] = ROLE_KEYWORDS[roleKey] ?? ROLE_KEYWORDS.general ?? [];
  const isTechnicalRole = ["full stack", "frontend", "backend", "java", "python", "devops", "qa", "data analyst"].includes(roleKey);

  if (headline.length > 5) {
    score += 5;
    strengths.push("Clear, focused professional headline aligned with ATS role indexing.");
  } else {
    improvements.push(isTechnicalRole
      ? "Add a specific professional headline with your target role and core tools."
      : "Add a specific professional headline with your target field and strongest professional skills.");
  }

  if (summary.length > 80) {
    score += 8;
    strengths.push("Well-structured professional summary providing immediate career context.");
  } else {
    improvements.push("Expand your professional summary into 3-4 impactful sentences highlighting core competencies.");
  }

  const skillCount = skills.split(",").filter((s: string) => s.trim().length > 0).length;
  if (skillCount >= 6) {
    score += 10;
    strengths.push(`Rich skill keyword density (${skillCount} distinct skills detected for ATS parsers).`);
  } else {
    improvements.push(isTechnicalRole
      ? "Include 8-12 specific technical skills and tools separated by commas."
      : "Include 8-12 field-relevant skills, methods, and professional strengths separated by commas.");
  }

  if (experience.length > 0) {
    const hasDetails = experience.some((e: any) => (e.details || "").length > 40);
    const hasMetrics = experience.some((e: any) => /\d|%|reduced|increased|improved|scaled/i.test(e.details || ""));
    if (hasDetails) score += 6;
    if (hasMetrics) {
      score += 6;
      strengths.push("Experience bullets incorporate action verbs and quantifiable achievements.");
    } else {
      improvements.push(isTechnicalRole
        ? "Enhance experience descriptions with measurable metrics such as latency, scale, users, or efficiency."
        : "Enhance experience descriptions with measurable outcomes such as learners taught, events coordinated, clients supported, or improvements delivered.");
    }
  } else {
    improvements.push("Add at least one professional experience entry or relevant internship.");
  }

  if (education.length > 0 && education[0]?.school) {
    score += 4;
    strengths.push("Clear educational credentials and institution verification.");
  }

  if (projects.length > 0 && projects.some((p: any) => p.name)) {
    score += 5;
    strengths.push(isTechnicalRole
      ? "Demonstrable technical projects validating practical application of skills."
      : "Relevant projects or activities showing practical application of field skills.");
  } else {
    improvements.push(isTechnicalRole
      ? "Add 1-2 notable projects featuring GitHub links or live production URLs."
      : "Add 1-2 relevant projects, workshops, events, portfolios, or community activities.");
  }

  score = Math.min(96, Math.max(55, score));

  // Determine verdict
  let verdict = "Solid Foundation - Minor Optimizations Recommended";
  if (score >= 88) verdict = "Excellent - Highly ATS Optimized";
  else if (score >= 78) verdict = "Strong Candidate Profile - High Interview Likelihood";
  else if (score < 70) verdict = "Needs Keyword & Structure Optimization";

  // Identify missing keywords for the role
  const expectedKeywords: string[] = roleKeywords;
  const currentSkillsLower = skills.toLowerCase();
  const missingKeywords = expectedKeywords
    .filter((kw) => !currentSkillsLower.includes(kw.toLowerCase()))
    .slice(0, 5);

  return {
    atsScore: score,
    verdict,
    strengths: strengths.slice(0, 4),
    missingKeywords,
    improvements: improvements.slice(0, 4),
  };
}

export function generateSkillGapRoadmap(
  role: string,
  profileSkills: string[],
  resumeContext: { summary?: string; experience?: { role?: string; details?: string }[]; education?: { degree?: string }[] } = {}
): {
  skills: { skill: string; status: "demonstrated" | "partial" | "unverified"; evidence: string; required_level: string }[];
  learningRoadmap: { week: string; topic: string; action: string }[];
} {
  const roleKey = getRoleKey(role);
  const expected: string[] = ROLE_KEYWORDS[roleKey] ?? ROLE_KEYWORDS["full stack"] ?? [];
  const evidenceText = [
    ...profileSkills,
    resumeContext.summary ?? "",
    ...(resumeContext.experience ?? []).flatMap((item) => [item.role ?? "", item.details ?? ""]),
    ...(resumeContext.education ?? []).map((item) => item.degree ?? ""),
  ].join(" ").toLowerCase();
  const profileLower = profileSkills.map((s) => s.toLowerCase().trim());

  const items = expected.map((skill) => {
    const sLower = skill.toLowerCase();
    const isDemonstrated = profileLower.some((p) => p === sLower || p.includes(sLower) || sLower.includes(p)) || evidenceText.includes(sLower);

    if (isDemonstrated) {
      return {
        skill,
        status: "demonstrated" as const,
        evidence: `Supported by your saved skills or resume evidence`,
        required_level: "Proficient / Production",
      };
    }

    const isPartial = profileLower.some((p) =>
      p.split(/[\s/]+/).some((token) => token.length > 2 && sLower.includes(token))
    );

    if (isPartial) {
      return {
        skill,
        status: "partial" as const,
        evidence: `Related evidence found in your resume or profile`,
        required_level: "Working Knowledge",
      };
    }

    return {
      skill,
      status: "unverified" as const,
      evidence: `Essential industry standard for ${role}`,
      required_level: "Required / In-Demand",
    };
  });

  const s0 = expected[0] ?? "Core Principles";
  const s1 = expected[1] ?? "Professional Practice";
  const s2 = expected[2] ?? "Applied Project";
  const roadmapByRole: Record<string, { topic: string; action: string }[]> = {
    teacher: [
      { topic: "Plan a learning unit", action: `Create a lesson sequence using ${s0}, clear learning outcomes, and age-appropriate activities.` },
      { topic: "Practice learner engagement", action: `Design a classroom activity that demonstrates ${s1} and inclusive communication.` },
      { topic: "Measure learning progress", action: `Build a simple assessment rubric using ${s2} and document how feedback improves outcomes.` },
      { topic: "Teaching portfolio & interview", action: "Prepare a sample lesson, teaching philosophy, and two evidence-based classroom stories." },
    ],
    trainer: [
      { topic: "Design a workshop", action: `Create a learner-centered session plan covering ${s0} with clear objectives.` },
      { topic: "Facilitate practice", action: `Run a short workshop using ${s1}, discussion prompts, and participant activities.` },
      { topic: "Evaluate outcomes", action: `Create an assessment and feedback loop around ${s2}.` },
      { topic: "Training portfolio", action: "Record a short demonstration and prepare examples of learner improvement." },
    ],
    "project coordinator": [
      { topic: "Plan the project", action: `Create a project brief, timeline, and responsibility matrix using ${s0}.` },
      { topic: "Run effective meetings", action: `Practice ${s1} by preparing an agenda, decisions log, and follow-up actions.` },
      { topic: "Track delivery risks", action: `Build a simple tracker for ${s2}, dependencies, and stakeholder updates.` },
      { topic: "Coordination portfolio", action: "Document a completed event or project with measurable delivery outcomes." },
    ],
    hr: [
      { topic: "Build hiring fundamentals", action: `Practice ${s0} through a structured role description and candidate scorecard.` },
      { topic: "Improve candidate experience", action: `Create an interview coordination and communication workflow using ${s1}.` },
      { topic: "Support people operations", action: `Design an onboarding checklist and feedback process around ${s2}.` },
      { topic: "HR portfolio & interview", action: "Prepare stories showing confidentiality, fairness, communication, and measurable people outcomes." },
    ],
  };
  const roadmap = (roadmapByRole[roleKey] ?? [
    { topic: "Strengthen core skills", action: `Build a practical foundation in ${s0} and ${s1}.` },
    { topic: "Practice in realistic tasks", action: `Complete a guided activity applying ${s2} to your target field.` },
    { topic: "Collect evidence", action: "Document outcomes, feedback, and examples that demonstrate your capabilities." },
    { topic: "Portfolio & interview readiness", action: `Prepare a focused portfolio and stories showing ${expected.slice(0, 3).join(", ")}.` },
  ]).map((step, index) => ({ week: `Week ${index + 1}`, ...step }));

  return { skills: items, learningRoadmap: roadmap };
}
