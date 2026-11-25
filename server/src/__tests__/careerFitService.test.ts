import { describe, it, expect } from "vitest";
import { computeDeterministicFit } from "../services/careerFitService";

describe("Career Fit Evaluation Service", () => {
  it("calculates strong fit for candidate with matching core skills and experience", () => {
    const candidateSkills = [
      "React",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "Next.js",
      "TailwindCSS",
      "REST APIs",
    ];
    const experience = [
      {
        company: "Tech Co",
        role: "Frontend Engineer",
        details: "Built React UI",
      },
      {
        company: "Startup Co",
        role: "Web Developer",
        details: "Built Next.js apps",
      },
    ];

    const result = computeDeterministicFit(
      "Frontend Developer",
      "Looking for a React and TypeScript frontend developer.",
      candidateSkills,
      experience,
      ["Frontend Development"]
    );

    expect(result.fitScore).toBeGreaterThanOrEqual(75);
    expect(["Strong Fit", "Moderate Fit"]).toContain(result.fitCategory);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Next.js"])
    );
    expect(result.confidence).toBe("high");
    expect(result.scoreBreakdown.weights.skills).toBe(0.45);
    expect(result.scoreBreakdown.weights.experience).toBe(0.35);
    expect(result.scoreBreakdown.weights.domain).toBe(0.2);
  });

  it("calculates partial fit / significant gap with honest advice for mismatched roles", () => {
    // Software developer targeting marketing role
    const candidateSkills = ["C++", "Embedded Systems", "Linux Kernel"];
    const experience = [
      {
        company: "Firmware Corp",
        role: "Embedded Systems Engineer",
        details: "Wrote RTOS drivers",
      },
    ];

    const result = computeDeterministicFit(
      "Content & Growth Marketing Lead",
      "Must have experience in SEO, copywriting, and social campaigns.",
      candidateSkills,
      experience,
      ["Hardware"]
    );

    expect(result.fitScore).toBeLessThan(70);
    expect(result.missingSkills.length).toBeGreaterThan(0);
    expect(result.recommendedRoles.length).toBeGreaterThan(0);
    expect(result.improvementPlan.length).toBeGreaterThan(0);
  });

  it("returns low confidence when candidate has minimal profile data", () => {
    const result = computeDeterministicFit(
      "Senior Cloud Architect",
      "Requires 8 years of AWS architecture.",
      [],
      [],
      []
    );

    expect(result.confidence).toBe("low");
    expect(result.fitScore).toBeLessThanOrEqual(50);
  });

  it("uses education-specific requirements for teaching roles", () => {
    const result = computeDeterministicFit(
      "Secondary School Teacher",
      "Teach students, plan lessons, assess learning, and manage a classroom.",
      ["Communication", "Public Speaking"],
      [{ role: "Teaching Assistant", details: "Supported classroom activities" }],
      ["B.Ed"]
    );

    expect(result.missingSkills.map((item) => item.skill)).toEqual(
      expect.arrayContaining(["Lesson Planning", "Classroom Management", "Student Assessment"])
    );
    expect(result.missingSkills.map((item) => item.skill)).not.toContain("React");
    expect(result.recommendedRoles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Instructional Designer" }),
      ])
    );
  });
});
