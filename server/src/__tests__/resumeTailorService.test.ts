import { describe, it, expect } from "vitest";
import {
  auditAtsReadiness,
  tailorContentFallback,
} from "../services/resumeTailorService";
import { IResumeContent } from "../models/Resume";

describe("Resume Tailoring and ATS Audit Service", () => {
  const sampleResume: IResumeContent = {
    template: "modern",
    name: "Alex Rivera",
    headline: "Full Stack Engineer",
    email: "alex@example.com",
    phone: "555-987-6543",
    location: "San Francisco, CA",
    website: "https://alex.dev",
    linkedin: "https://linkedin.com/in/alexrivera",
    summary:
      "Results-oriented engineer with 5 years experience developing scalable microservices and responsive web apps.",
    skills: "React, TypeScript, Node.js, PostgreSQL, Docker, AWS",
    achievements: "Deployed microservices serving 1M users",
    languages: "English",
    customTitle: "",
    customContent: "",
    experience: [
      {
        company: "Apex Tech",
        role: "Senior Software Engineer",
        dates: "2021 - Present",
        details:
          "• Developed cloud-native APIs using Node.js and TypeScript.\n• Improved database indexing reducing query times by 40%.",
      },
    ],
    education: [
      {
        school: "UC Berkeley",
        degree: "BS Computer Science",
        dates: "2017 - 2021",
      },
    ],
    projects: [
      {
        name: "Cloud Dashboard",
        link: "https://github.com/alex/dashboard",
        details: "Realtime metrics dashboard built in React and TailwindCSS.",
      },
    ],
    certifications: [
      {
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2022",
      },
    ],
  };

  it("audits ATS readiness and detects keyword coverage and formatting", () => {
    const jd =
      "Seeking a Senior Software Engineer with strong TypeScript, PostgreSQL, and AWS experience.";
    const audit = auditAtsReadiness(sampleResume, jd, "Senior Software Engineer");

    expect(audit.heading_structure.valid).toBe(true);
    expect(audit.date_consistency.valid).toBe(true);
    expect(audit.keyword_coverage.coverage_percent).toBeGreaterThan(50);
    expect(["Excellent", "Good"]).toContain(audit.overall_readiness);
  });

  it("applies big_tech tailoring style without altering candidate identity", () => {
    const tailored = tailorContentFallback(
      sampleResume,
      "Principal Systems Engineer",
      "Google",
      "big_tech",
      "Scalable infrastructure and microservices."
    );

    expect(tailored.tailoredContent.name).toBe("Alex Rivera");
    expect(tailored.tailoredContent.email).toBe("alex@example.com");
    expect(tailored.tailoredContent.headline).toContain("Principal Systems Engineer");
    expect(tailored.tailoredContent.headline).toContain("Google");
    expect(tailored.tailoredContent.experience[0]?.company).toBe("Apex Tech");
    expect(tailored.styleRationale).toContain("BIG TECH");
  });

  it("applies startup tailoring style emphasizing ownership and execution", () => {
    const tailored = tailorContentFallback(
      sampleResume,
      "Founding Engineer",
      "Fintech AI",
      "startup",
      "Fast-paced environment shipping zero-to-one products."
    );

    expect(tailored.tailoredContent.summary).toContain("velocity");
    expect(tailored.styleRationale).toContain("STARTUP");
  });
});
