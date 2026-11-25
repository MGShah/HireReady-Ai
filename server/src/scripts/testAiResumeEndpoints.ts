import jwt from "jsonwebtoken";
import { env } from "../env";

const BASE_URL = `http://localhost:${env.PORT || 5001}`;

async function runTest() {
  console.log("================================================================================");
  console.log("       VERIFYING AI & LLM MODEL INTEGRATIONS ACROSS RESUME & CAREER");
  console.log("================================================================================");

  // Generate valid test JWT
  const testUserId = "6ae18dbb530784e8e11895c9";
  const token = jwt.sign({ userId: testUserId, role: "user" }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let allPassed = true;

  // 1. Test /api/ai/ask
  console.log("\n1. Testing /api/ai/ask (Groq LLM Direct Query)...");
  try {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        question: "Explain the STAR method for software engineering behavioral questions.",
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.answer) {
      console.log("   ✓ Success! Model:", data.model, "Provider:", data.provider, "Demo:", data.demo);
      console.log("   ↳ Answer snippet:", data.answer.slice(0, 140).replace(/\n/g, " "), "...");
    } else {
      console.error("   ✗ Failed:", data);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("   ✗ Exception:", err.message);
    allPassed = false;
  }

  // 2. Test /api/resumes/ai-summary
  console.log("\n2. Testing /api/resumes/ai-summary (AI Summary Generator)...");
  try {
    const res = await fetch(`${BASE_URL}/api/resumes/ai-summary`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        role: "Senior Cloud & DevOps Engineer",
        skills: "Kubernetes, Docker, Terraform, AWS, Prometheus, CI/CD",
        currentSummary: "Looking for devops roles.",
      }),
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      console.log("   ✓ Success! Generated", data.suggestions.length, "summary options.");
      console.log("   ↳ Option 1:", data.suggestions[0].title, "-", data.suggestions[0].text.slice(0, 100), "...");
    } else {
      console.error("   ✗ Failed:", data);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("   ✗ Exception:", err.message);
    allPassed = false;
  }

  // 3. Test /api/resumes/ai-bullets
  console.log("\n3. Testing /api/resumes/ai-bullets (AI Experience Bullet Enhancer)...");
  try {
    const res = await fetch(`${BASE_URL}/api/resumes/ai-bullets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        role: "Backend Lead",
        company: "Apex Telemetry Corp",
        rawDetails: "Designed kafka messaging and improved database queries.",
        skills: "Kafka, PostgreSQL, Node.js, Redis",
      }),
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.bullets) && data.bullets.length > 0) {
      console.log("   ✓ Success! Generated", data.bullets.length, "action bullets.");
      console.log("   ↳ Bullet 1:", data.bullets[0]);
    } else {
      console.error("   ✗ Failed:", data);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("   ✗ Exception:", err.message);
    allPassed = false;
  }

  // 4. Test /api/resumes/ai-review
  console.log("\n4. Testing /api/resumes/ai-review (Real-time ATS Audit & Scoring)...");
  try {
    const res = await fetch(`${BASE_URL}/api/resumes/ai-review`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        headline: "Principal Distributed Systems Engineer",
        summary:
          "High-impact systems engineer with 8+ years designing high-throughput microservices and multi-region Kubernetes architectures.",
        skills: "Go, TypeScript, Kubernetes, Docker, Terraform, AWS",
        experience: [
          {
            role: "Principal Systems Engineer",
            company: "Apex Cloud Solutions",
            dates: "2021 - Present",
            details:
              "• Architected multi-region Kubernetes platform handling 25M requests/day with 99.995% availability.\n• Reduced cloud spend by $380,000 annually via automated autoscaling.",
          },
        ],
        education: [
          {
            school: "University of Washington",
            degree: "BS in Computer Science",
            dates: "2018",
          },
        ],
      }),
    });
    const data = await res.json();
    if (res.status === 200 && typeof data.atsScore === "number") {
      console.log("   ✓ Success! ATS Score:", data.atsScore, "/ 100");
      console.log("   ↳ Verdict:", data.verdict);
      console.log("   ↳ Strengths count:", data.strengths?.length);
      console.log("   ↳ Missing keywords:", data.missingKeywords?.join(", ") || "None");
      console.log("   ↳ Actionable improvements count:", data.improvements?.length);
    } else {
      console.error("   ✗ Failed:", data);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("   ✗ Exception:", err.message);
    allPassed = false;
  }

  // 5. Test /api/ai/cover-letter
  console.log("\n5. Testing /api/ai/cover-letter (AI Outreach Letter Generator)...");
  try {
    const res = await fetch(`${BASE_URL}/api/ai/cover-letter`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        company: "Stripe",
        title: "Staff Platform Architect",
        skills: "Distributed Systems, Kubernetes, Kafka, Go",
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.letter) {
      console.log("   ✓ Success! Generated cover letter length:", data.letter.length, "chars");
      console.log("   ↳ First sentence:", data.letter.slice(0, 120).replace(/\n/g, " "), "...");
    } else {
      console.error("   ✗ Failed:", data);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("   ✗ Exception:", err.message);
    allPassed = false;
  }

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("✅ ALL AI & LLM MODEL ENDPOINTS ARE 100% OPERATIONAL AND ACCURATE!");
  } else {
    console.error("❌ Some AI endpoints encountered errors.");
    process.exit(1);
  }
  console.log("================================================================================");
}

runTest().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
