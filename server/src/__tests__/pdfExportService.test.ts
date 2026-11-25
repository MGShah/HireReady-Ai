import { describe, it, expect } from "vitest";
import { generateResumePdfBuffer } from "../services/pdfExportService";
import { IResumeContent } from "../models/Resume";

describe("PDF Export Service", () => {
  const sampleResume: IResumeContent = {
    template: "modern",
    name: "Jordan Lee",
    headline: "Senior Cloud Engineer",
    email: "jordan@example.com",
    phone: "555-0199",
    location: "Austin, TX",
    website: "https://jordan.cloud",
    linkedin: "https://linkedin.com/in/jordanlee",
    summary:
      "Cloud architect with deep expertise in Kubernetes, Terraform, and resilient distributed architectures.",
    skills: "Kubernetes, Terraform, AWS, Docker, Go, Python, CI/CD",
    achievements: "Managed 50+ Kubernetes clusters across multi-region VPCs",
    languages: "English, Spanish",
    customTitle: "",
    customContent: "",
    experience: [
      {
        company: "CloudScale Inc",
        role: "Senior Cloud Engineer",
        dates: "2020 - Present",
        details:
          "• Architected automated infrastructure provisioning reducing deployment cycle by 60%.\n• Managed multi-tenant Kubernetes clusters with 99.99% availability.",
      },
    ],
    education: [
      {
        school: "Texas A&M University",
        degree: "BS Electrical Engineering",
        dates: "2016 - 2020",
      },
    ],
    projects: [
      {
        name: "Terraform Module Registry",
        link: "https://github.com/jordan/tf-modules",
        details: "Open source reusable Terraform modules with 1.2k GitHub stars.",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect - Professional",
        issuer: "AWS",
        date: "2023",
      },
    ],
  };

  it("generates a valid, non-empty PDF buffer with PDF magic bytes (%PDF-)", async () => {
    const buffer = await generateResumePdfBuffer(sampleResume, {
      template: "modern",
      fontFamily: "Inter",
      fontSize: "regular",
      accentColor: "#059669",
      marginOption: "normal",
      bulletStyle: "disc",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF magic bytes header check
    const header = buffer.toString("utf-8", 0, 5);
    expect(header).toBe("%PDF-");
  });

  it("supports classic, minimal, and executive templates without errors", async () => {
    for (const template of ["classic", "minimal", "executive"] as const) {
      const buffer = await generateResumePdfBuffer(sampleResume, {
        template,
        fontFamily: "Merriweather",
        fontSize: "small",
      });
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString("utf-8", 0, 5)).toBe("%PDF-");
    }
  });
});
