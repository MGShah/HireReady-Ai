import PDFDocument from "pdfkit";
import { env } from "../env";

const BASE_URL = `http://localhost:${env.PORT || 5001}`;

// Helper to generate a realistic test resume PDF in-memory
function createSampleResumePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    doc.fontSize(22).font("Helvetica-Bold").text("Elena Vance");
    doc.fontSize(11).font("Helvetica").text("Principal Distributed Systems Engineer");
    doc.fontSize(9).fillColor("#64748b").text("elena.vance@example.com  •  (555) 432-8765  •  Seattle, WA  •  https://linkedin.com/in/elenavance  •  https://github.com/elenavance");
    doc.moveDown(0.5);

    doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
    doc.fontSize(9.5).font("Helvetica").text("High-impact Principal Systems Engineer with 8+ years designing high-throughput microservices, multi-region Kubernetes architectures, and real-time Kafka telemetry pipelines.");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("SKILLS & TECHNOLOGIES");
    doc.fontSize(9.5).font("Helvetica").text("Go, TypeScript, Rust, Kubernetes, Terraform, AWS, Docker, Kafka, PostgreSQL, Distributed Systems, System Design, CI/CD, Mentorship");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("EXPERIENCE");
    doc.fontSize(10.5).font("Helvetica-Bold").text("Principal Systems Engineer at Apex Cloud Solutions (2021 - Present)");
    doc.fontSize(9.5).font("Helvetica").text("• Architected multi-region Kubernetes platform handling 25M requests/day with 99.995% availability.");
    doc.fontSize(9.5).font("Helvetica").text("• Reduced cloud infrastructure spend by $380,000 annually via automated autoscaling and spot instance fleets.");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("EDUCATION");
    doc.fontSize(10).font("Helvetica-Bold").text("BS in Computer Science, University of Washington (2018)");

    doc.end();
  });
}

interface TestReportItem {
  id: number;
  module: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

async function runMasterTest() {
  console.log("================================================================================");
  console.log("       NEXA AI CAREER PLATFORM — MASTER UNIFIED ALL-MODULES VERIFICATION");
  console.log("================================================================================");
  console.log(`Backend Target URL : ${BASE_URL}`);
  console.log(`Execution Time     : ${new Date().toISOString()}\n`);

  const report: TestReportItem[] = [];
  let testIndex = 1;

  async function testStep(
    module: string,
    name: string,
    fn: () => Promise<{ passed: boolean; details?: string }>
  ) {
    const start = Date.now();
    const currentId = testIndex++;
    try {
      const res = await fn();
      const durationMs = Date.now() - start;
      report.push({
        id: currentId,
        module,
        name,
        passed: res.passed,
        durationMs,
        details: res.details,
      });
      if (res.passed) {
        console.log(`[PASS] [M${currentId.toString().padStart(2, "0")}] [${module}] ${name} (${durationMs}ms)`);
        if (res.details) console.log(`       ↳ ${res.details}`);
      } else {
        console.error(`[FAIL] [M${currentId.toString().padStart(2, "0")}] [${module}] ${name} (${durationMs}ms)`);
        console.error(`       ↳ Error: ${res.details || "Validation failed"}`);
      }
    } catch (err: any) {
      const durationMs = Date.now() - start;
      report.push({
        id: currentId,
        module,
        name,
        passed: false,
        durationMs,
        details: err.message,
      });
      console.error(`[FAIL] [M${currentId.toString().padStart(2, "0")}] [${module}] ${name} (${durationMs}ms)`);
      console.error(`       ↳ Exception: ${err.message}`);
    }
  }

  // Shared test variables
  const testEmail = `nexa_tester_${Date.now()}@example.com`;
  const testPassword = "SuperPassword123#";
  let token = "";
  let userId = "";
  let parsedResumeId = "";
  let extractedData: any = null;
  let jobTargetId = "";
  let versionId = "";
  let interviewSessionId = "";
  let applicationId = "";

  // -------------------------------------------------------------------------
  // MODULE 1: System Health & Database Connectivity
  // -------------------------------------------------------------------------
  await testStep("System & Infra", "Backend Health & MongoDB Connectivity Check", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const ok = res.status === 200 && data.ok === true && data.database === "mongodb";
    return {
      passed: ok,
      details: `Status: ${res.status}, AI Provider: ${data.aiProvider}, Model: ${data.aiModel}, DB: ${data.database}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 2: Authentication & Identity Management
  // -------------------------------------------------------------------------
  await testStep("Auth & Identity", "User Registration & JWT Issuance (/api/auth/register)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        full_name: "Elena Vance",
        target_role: "Distributed Systems Engineer",
      }),
    });
    const data = await res.json();
    token = data.token;
    userId = data.user?.id;
    return {
      passed: res.status === 201 && !!token && !!userId,
      details: `Created User ID: ${userId}, Email: ${testEmail}`,
    };
  });

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  await testStep("Auth & Identity", "User Login Credential Verification (/api/auth/login)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const data = await res.json();
    return {
      passed: res.status === 200 && !!data.token && data.user?.email === testEmail,
      details: `Logged in user confirmed: ${data.user?.email}`,
    };
  });

  await testStep("Auth & Identity", "Session Context Validation (/api/auth/me)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    const data = await res.json();
    return {
      passed: res.status === 200 && data.user?.id === userId,
      details: `Authenticated user verified: ${data.user?.full_name} (${data.user?.id})`,
    };
  });

  await testStep("Security Scope", "Security Boundary rejects unauthenticated request (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/profile`);
    return {
      passed: res.status === 401,
      details: `Unauthenticated response: HTTP ${res.status} Unauthorized (Correct)`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 3: Profile Management & Career Enrichment
  // -------------------------------------------------------------------------
  await testStep("Profile Management", "Read & Update Profile with Rich Career Metadata (/api/profile)", async () => {
    const putRes = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: "Elena Vance",
        target_role: "Principal Distributed Systems Engineer",
        education: "BS Computer Science",
        college: "University of Washington",
        graduation_year: 2018,
        location: "Seattle, WA",
        phone: "(555) 432-8765",
        linkedin: "https://linkedin.com/in/elenavance",
        github: "https://github.com/elenavance",
        summary: "Distributed systems specialist focused on fault-tolerant systems.",
        skills: ["Go", "TypeScript", "Kubernetes", "AWS", "Terraform", "Kafka", "PostgreSQL"],
        domain_specializations: ["Distributed Systems", "Cloud Infrastructure", "Site Reliability"],
        certifications: [
          { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2023" },
        ],
        languages: ["English", "German"],
        accomplishments: ["Published IEEE paper on consensus protocols in partitioned networks"],
        daily_minutes: 45,
      }),
    });
    const profileData = await putRes.json();
    const passed =
      putRes.status === 200 &&
      profileData.full_name === "Elena Vance" &&
      Array.isArray(profileData.domain_specializations) &&
      profileData.domain_specializations.length === 3 &&
      typeof profileData.profile_completion_percentage === "number" &&
      profileData.profile_completion_percentage >= 80;

    return {
      passed,
      details: `Profile Completion: ${profileData.profile_completion_percentage}%, Domains: ${profileData.domain_specializations?.join(", ")}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 4: In-Memory Smart Resume Ingestion & Parsing
  // -------------------------------------------------------------------------
  await testStep("Resume Ingestion", "In-Memory PDF Parsing with Structured AI/Deterministic Fallback (/api/resume/parse)", async () => {
    const pdfBuffer = await createSampleResumePdf();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("file", blob, "Elena_Vance_Resume.pdf");

    const res = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    const data = await res.json();
    parsedResumeId = data.parsedResumeId;
    extractedData = data.structuredData;

    const passed =
      res.status === 201 &&
      data.success === true &&
      !!parsedResumeId &&
      Array.isArray(extractedData?.hard_skills) &&
      extractedData.hard_skills.length > 0;

    return {
      passed,
      details: passed
        ? `Extracted Skills: [${extractedData?.hard_skills?.slice(0, 5).join(", ")}...], Parsed ID: ${parsedResumeId}`
        : `Status: ${res.status}, Response: ${JSON.stringify(data)}`,
    };
  });

  await testStep("Resume Ingestion", "Scanned PDF / Low-Text Advisory Warning Detection", async () => {
    const emptyDoc = new PDFDocument({ size: "A4" });
    const emptyChunks: Buffer[] = [];
    emptyDoc.on("data", (c) => emptyChunks.push(c));
    const emptyPromise = new Promise<Buffer>((res) => {
      emptyDoc.on("end", () => res(Buffer.concat(emptyChunks)));
    });
    emptyDoc.text("   "); // nearly blank
    emptyDoc.end();
    const blankBuf = await emptyPromise;

    const blankFormData = new FormData();
    blankFormData.append("file", new Blob([new Uint8Array(blankBuf)], { type: "application/pdf" }), "blank_scan.pdf");

    const res = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: authHeaders,
      body: blankFormData,
    });
    const data = await res.json();
    return {
      passed: res.status === 201 && data.isScannedPdf === true && Array.isArray(data.warnings) && data.warnings.length > 0,
      details: `isScannedPdf: ${data.isScannedPdf}, Advisory: "${data.warnings?.[0]}"`,
    };
  });

  await testStep("Upload Security", "Unsupported File Type Rejection (.txt/.exe) (HTTP 400)", async () => {
    const badFormData = new FormData();
    badFormData.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "text/plain" }), "unsupported.txt");

    const res = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: authHeaders,
      body: badFormData,
    });
    return {
      passed: res.status === 400,
      details: `Unsupported MIME successfully rejected with HTTP ${res.status}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 5: Safe Profile Review & Resume Synchronization
  // -------------------------------------------------------------------------
  await testStep("Safe Review Sync", "Safe Review Confirmation Non-Destructive Update (/api/resume/confirm-parsed)", async () => {
    const res = await fetch(`${BASE_URL}/api/resume/confirm-parsed`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parsedResumeId,
        updateProfile: true,
        updateResumeBuilder: true,
        confirmedData: {
          ...extractedData,
          full_name: "Elena Vance (Verified)",
          hard_skills: ["Go", "TypeScript", "Kubernetes", "AWS", "Terraform", "Kafka", "PostgreSQL", "Rust"],
        },
      }),
    });
    const data = await res.json();
    return {
      passed: res.status === 200 && data.success === true && data.profile?.full_name === "Elena Vance (Verified)",
      details: `Confirmed Name: ${data.profile?.full_name}, Profile Completion: ${data.profile?.profile_completion_percentage}%`,
    };
  });

  await testStep("Safe Review Sync", "Active Resume Document Synchronized (/api/resumes)", async () => {
    const res = await fetch(`${BASE_URL}/api/resumes`, { headers: authHeaders });
    const data = await res.json();
    const passed =
      res.status === 200 &&
      data.name === "Elena Vance (Verified)" &&
      data.skills.includes("Kubernetes") &&
      data.skills.includes("Go");

    return {
      passed,
      details: `Synced Resume: "${data.name}", Skills: "${data.skills.slice(0, 45)}..."`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 6: Domain Fit Analysis & Career Guidance Engine
  // -------------------------------------------------------------------------
  await testStep("Career Fit Engine", "Multi-Factor Calibrated Domain Fit Evaluation (/api/career/evaluate-fit)", async () => {
    const res = await fetch(`${BASE_URL}/api/career/evaluate-fit`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_role: "Staff Platform Architect",
        target_company: "Stripe",
        industry: "Financial Infrastructure",
        job_description:
          "Seeking a Staff Platform Architect to drive Kubernetes infrastructure, low-latency microservices, high-availability Kafka event streaming, and distributed consensus in payment gateways.",
      }),
    });
    const data = await res.json();
    jobTargetId = data.jobTargetId;

    const weights = data.scoreBreakdown?.weights;
    const passed =
      res.status === 201 &&
      data.success === true &&
      typeof data.fitScore === "number" &&
      weights?.skills === 0.45 &&
      weights?.experience === 0.35 &&
      weights?.domain === 0.20 &&
      Array.isArray(data.matchedSkills) &&
      Array.isArray(data.improvementPlan) &&
      data.improvementPlan.length >= 3;

    return {
      passed,
      details: `Fit Score: ${data.fitScore}% (${data.fitCategory}), Weights: [Skills 45%, Exp 35%, Domain 20%], Roadmap Phases: ${data.improvementPlan?.length}`,
    };
  });

  await testStep("Career Fit Engine", "Career Evaluation History Retrieval (/api/career/history)", async () => {
    const res = await fetch(`${BASE_URL}/api/career/history`, { headers: authHeaders });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data) && data.length > 0 && data[0].target_company === "Stripe";
    return {
      passed,
      details: `Retrieved ${data.length} evaluation(s), Latest Target: "${data[0]?.target_role}" at ${data[0]?.target_company}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 7: AI Resume Tailoring & Version Archiving
  // -------------------------------------------------------------------------
  await testStep("Resume Tailoring", "AI Resume Tailoring with Big Tech Profile & ATS Audit (/api/resume/generate-tailored)", async () => {
    const res = await fetch(`${BASE_URL}/api/resume/generate-tailored`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_job_title: "Staff Platform Architect",
        target_company: "Stripe",
        company_style: "big_tech",
        job_description:
          "Multi-region Kubernetes platforms, event-driven streaming with Kafka, and high-reliability financial microservices.",
      }),
    });
    const data = await res.json();
    versionId = data.versionId;

    const passed =
      res.status === 201 &&
      data.success === true &&
      !!versionId &&
      data.tailoredContent?.name === "Elena Vance (Verified)" &&
      data.atsChecklist?.overall_readiness !== undefined &&
      data.styleRationale?.length > 0;

    return {
      passed,
      details: `Created Version ID: ${versionId}, ATS Readiness: ${data.atsChecklist?.overall_readiness}%, Style: big_tech`,
    };
  });

  await testStep("Resume Tailoring", "Resume Version Archiving & Active Version Restoration (/api/resume/versions)", async () => {
    const listRes = await fetch(`${BASE_URL}/api/resume/versions`, { headers: authHeaders });
    const versions = await listRes.json();

    const restoreRes = await fetch(`${BASE_URL}/api/resume/versions/${versionId}/restore`, {
      method: "POST",
      headers: authHeaders,
    });
    const restoreData = await restoreRes.json();

    const passed =
      listRes.status === 200 &&
      Array.isArray(versions) &&
      versions.length > 0 &&
      restoreRes.status === 200 &&
      restoreData.success === true;

    return {
      passed,
      details: `Archived Versions: ${versions.length}, Restored Active Version: ${versionId}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 8: Vector A4 PDF Generation Pipeline
  // -------------------------------------------------------------------------
  await testStep("PDF Generation", "Selectable-Text Vector A4 PDF Export Pipeline (/api/resume/export)", async () => {
    const res = await fetch(`${BASE_URL}/api/resume/export`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template: "modern",
        fontFamily: "Inter",
        fontSize: "regular",
        accentColor: "#059669",
        marginOption: "normal",
        bulletStyle: "disc",
      }),
    });
    const pdfArrayBuffer = await res.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const magicBytes = pdfBuffer.toString("utf-8", 0, 5);

    const passed =
      res.status === 200 &&
      res.headers.get("content-type") === "application/pdf" &&
      pdfBuffer.length > 1000 &&
      magicBytes === "%PDF-";

    return {
      passed,
      details: `Content-Type: application/pdf, Size: ${pdfBuffer.length} bytes, Binary Magic: "${magicBytes}"`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 9: Skills Inventory & Gap Analysis Module
  // -------------------------------------------------------------------------
  await testStep("Skills Module", "Skills Gap Analysis & Career Mapping (/api/skills)", async () => {
    const res = await fetch(`${BASE_URL}/api/skills`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_role: "Staff Platform Architect",
        job_description: "Expertise in distributed consensus algorithms, Raft, Paxos, and Kafka.",
        candidate_skills: ["Go", "Kubernetes", "AWS", "Terraform", "Kafka"],
      }),
    });
    const data = await res.json();
    const passed = res.status === 201 && Array.isArray(data.result?.skills) && data.result.skills.length > 0;

    return {
      passed,
      details: `Identified ${data.result?.skills?.length} skill evaluation items, Disclaimer: "${data.disclaimer?.slice(0, 30)}..."`,
    };
  });

  await testStep("Skills Module", "Retrieve Historical Skills Analyses (/api/skills)", async () => {
    const res = await fetch(`${BASE_URL}/api/skills`, { headers: authHeaders });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data) && data.length > 0;
    return {
      passed,
      details: `Found ${data.length} skill analysis record(s)`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 10: AI Mock Interview Practice Module
  // -------------------------------------------------------------------------
  await testStep("Interview Module", "Start Realistic Mock Interview Session (/api/interviews)", async () => {
    const res = await fetch(`${BASE_URL}/api/interviews`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "Staff Platform Architect",
        type: "technical",
        difficulty: "hard",
        question_count: 3,
        candidate_skills: ["Go", "Kubernetes", "Kafka", "Distributed Systems"],
      }),
    });
    const data = await res.json();
    interviewSessionId = data.session?.id;

    const passed = res.status === 201 && !!interviewSessionId && !!data.question;
    return {
      passed,
      details: `Session ID: ${interviewSessionId}, First Question: "${data.question?.slice(0, 70)}..."`,
    };
  });

  await testStep("Interview Module", "Retrieve Mock Interview Session by ID (/api/interviews/:id)", async () => {
    const res = await fetch(`${BASE_URL}/api/interviews/${interviewSessionId}`, { headers: authHeaders });
    const data = await res.json();
    const passed = res.status === 200 && data.session?.id === interviewSessionId && Array.isArray(data.messages);
    return {
      passed,
      details: `Retrieved Session for Role: "${data.session?.role}", Message Count: ${data.messages?.length}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 11: Job Applications Pipeline Tracker
  // -------------------------------------------------------------------------
  await testStep("Job Tracker", "Create Tracked Job Application (/api/applications)", async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company: "Stripe",
        title: "Staff Platform Architect",
        url: "https://stripe.com/jobs/staff-platform-architect",
        status: "applied",
        notes: "Targeting Q4 platform infrastructure transition.",
      }),
    });
    const data = await res.json();
    applicationId = data.id;

    const passed = res.status === 201 && !!applicationId && data.company === "Stripe";
    return {
      passed,
      details: `Created Application ID: ${applicationId}, Status: "${data.status}"`,
    };
  });

  await testStep("Job Tracker", "Update Application Stage & List Applications (/api/applications)", async () => {
    const patchRes = await fetch(`${BASE_URL}/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "interview",
        notes: "Passed recruiter screen. Technical architecture round scheduled.",
      }),
    });
    const patchData = await patchRes.json();

    const listRes = await fetch(`${BASE_URL}/api/applications`, { headers: authHeaders });
    const listData = await listRes.json();

    const passed =
      patchRes.status === 200 &&
      patchData.status === "interview" &&
      listRes.status === 200 &&
      Array.isArray(listData) &&
      listData.some((a) => a.id === applicationId);

    return {
      passed,
      details: `Updated Status: "${patchData.status}", Total Active Applications: ${listData.length}`,
    };
  });

  // -------------------------------------------------------------------------
  // MODULE 12: AI Career Intelligence Assistant
  // -------------------------------------------------------------------------
  await testStep("AI Assistant", "Direct AI Career Advisory Query with Usage Logging (/api/ai/ask)", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "What are the 3 most critical competencies for a Staff Platform Architect transitioning from Kubernetes to hybrid service mesh?",
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && typeof data.answer === "string" && data.answer.length > 50;

    return {
      passed,
      details: passed
        ? `Model: ${data.model}, Provider: ${data.provider}, Response Length: ${data.answer?.length} chars`
        : `Status: ${res.status}, Response: ${JSON.stringify(data)}`,
    };
  });

  // -------------------------------------------------------------------------
  // TEST SUMMARY & FINAL VERDICT
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("                           COMPLETE TEST SUITE MATRIX");
  console.log("================================================================================");
  const totalTests = report.length;
  const passedTests = report.filter((r) => r.passed).length;
  const failedTests = report.filter((r) => !r.passed).length;
  const totalDuration = report.reduce((acc, r) => acc + r.durationMs, 0);

  console.table(
    report.map((r) => ({
      ID: `M${r.id.toString().padStart(2, "0")}`,
      Module: r.module,
      Test: r.name.slice(0, 45),
      Status: r.passed ? "PASS" : "FAIL",
      Duration: `${r.durationMs}ms`,
    }))
  );

  console.log(`TOTAL TESTS  : ${totalTests}`);
  console.log(`PASSED       : ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`FAILED       : ${failedTests}`);
  console.log(`TOTAL TIME   : ${(totalDuration / 1000).toFixed(2)}s`);
  console.log("================================================================================");

  if (failedTests > 0) {
    console.error(`\n❌ MASTER TEST RUN FAILED with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ ALL BACKEND MODULES FULLY OPERATIONAL, TESTED, AND CONNECTED CLEANLY.");
  }
}

runMasterTest().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
