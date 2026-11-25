import PDFDocument from "pdfkit";
import { env } from "../env";

const BASE_URL = `http://localhost:${env.PORT || 5001}`;

// Helper to generate a sample PDF in memory
function createSampleResumePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    doc.fontSize(22).font("Helvetica-Bold").text("Sarah Connor");
    doc.fontSize(11).font("Helvetica").text("Lead Cloud Systems Engineer");
    doc.fontSize(9).fillColor("#64748b").text("sarah.connor@example.com  •  (555) 019-2831  •  Austin, TX  •  https://linkedin.com/in/sarahconnor  •  https://github.com/sarahconnor");
    doc.moveDown(0.5);

    doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
    doc.fontSize(9.5).font("Helvetica").text("Results-driven Lead Cloud Systems Engineer with 7+ years of experience architecting resilient cloud infrastructure, distributed microservices, and automated CI/CD pipelines.");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("SKILLS & COMPETENCIES");
    doc.fontSize(9.5).font("Helvetica").text("TypeScript, React, Node.js, Kubernetes, Docker, Terraform, AWS, PostgreSQL, Redis, CI/CD, Problem Solving, Leadership");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("WORK EXPERIENCE");
    doc.fontSize(10.5).font("Helvetica-Bold").text("Lead Infrastructure Engineer at Cyberdyne Systems (2021 - Present)");
    doc.fontSize(9.5).font("Helvetica").text("• Architected multi-region Kubernetes clusters supporting 10M requests daily with 99.99% uptime.");
    doc.fontSize(9.5).font("Helvetica").text("• Automated infrastructure provisioning with Terraform, reducing deployment lead time by 65%.");
    doc.moveDown(0.5);

    doc.fontSize(13).font("Helvetica-Bold").text("EDUCATION");
    doc.fontSize(10).font("Helvetica-Bold").text("BS in Computer Science, University of Texas at Austin (2018)");

    doc.end();
  });
}

async function runAllTests() {
  console.log("==========================================================");
  console.log("   NEXA AI CAREER PLATFORM — END-TO-END SYSTEM INTEGRATION TEST");
  console.log("==========================================================");
  console.log(`Target Backend Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details || "Assertion failed"}`);
      failed++;
    }
  }

  // 1. Health Check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.ok === true, "1. API Health Check (/api/health)");
  } catch (err: any) {
    assert(false, "1. API Health Check (/api/health)", err.message);
  }

  // 2. Authentication: Register new test user
  const testEmail = `nexa_tester_${Date.now()}@example.com`;
  const testPassword = "SuperSecurePassword123!";
  let token = "";
  let userId = "";

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        full_name: "Sarah Connor Initial",
        target_role: "Cloud Engineer",
      }),
    });
    const regData = await regRes.json();
    token = regData.token;
    userId = regData.user?.id;
    assert(
      regRes.status === 201 && !!token && !!userId,
      "2. User Registration & JWT Token Issuance (/api/auth/register)"
    );
  } catch (err: any) {
    assert(false, "2. User Registration", err.message);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 3. Security / Scoping: Unauthenticated access rejection
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/profile`);
    assert(unauthRes.status === 401, "3. Security Middleware rejects unauthenticated request (401)");
  } catch (err: any) {
    assert(false, "3. Security Middleware", err.message);
  }

  // 4. Resume Parsing (PDF Upload)
  let parsedResumeId = "";
  let structuredData: any = null;

  try {
    const pdfBuffer = await createSampleResumePdf();
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("file", blob, "Sarah_Connor_Resume.pdf");

    const parseRes = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const parseData = await parseRes.json();
    parsedResumeId = parseData.parsedResumeId;
    structuredData = parseData.structuredData;

    assert(
      parseRes.status === 201 &&
        parseData.success === true &&
        !!parsedResumeId &&
        Array.isArray(structuredData.hard_skills) &&
        structuredData.hard_skills.length > 0,
      "4. Smart Resume PDF Upload & Text Parsing (/api/resume/parse)",
      `Extracted skills: ${structuredData?.hard_skills?.join(", ")}`
    );
  } catch (err: any) {
    assert(false, "4. Smart Resume PDF Parsing", err.message);
  }

  // 5. Scanned PDF Detection check with empty buffer
  try {
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
    blankFormData.append("file", new Blob([new Uint8Array(blankBuf)], { type: "application/pdf" }), "scan.pdf");

    const scanRes = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: blankFormData,
    });
    const scanData = await scanRes.json();

    assert(
      scanData.isScannedPdf === true && scanData.warnings.length > 0,
      "5. Scanned / Low-Text Document Detection & Advisory Warning"
    );
  } catch (err: any) {
    assert(false, "5. Scanned Document Detection", err.message);
  }

  // 6. Safe Profile Review Confirmation (Never overwrites without user confirmation)
  try {
    const confirmRes = await fetch(`${BASE_URL}/api/resume/confirm-parsed`, {
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
          ...structuredData,
          full_name: "Sarah Connor (Confirmed)",
          hard_skills: ["Kubernetes", "Docker", "Terraform", "AWS", "TypeScript", "Node.js"],
        },
      }),
    });
    const confirmData = await confirmRes.json();

    assert(
      confirmRes.status === 200 &&
        confirmData.success === true &&
        confirmData.profile.full_name === "Sarah Connor (Confirmed)",
      "6. User Review & Confirmation Updates Profile (/api/resume/confirm-parsed)"
    );
  } catch (err: any) {
    assert(false, "6. User Review Confirmation", err.message);
  }

  // 7. Verification of Active Resume State
  try {
    const resumeRes = await fetch(`${BASE_URL}/api/resumes`, { headers: authHeaders });
    const resumeData = await resumeRes.json();
    assert(
      resumeRes.status === 200 &&
        resumeData.name === "Sarah Connor (Confirmed)" &&
        resumeData.skills.includes("Kubernetes"),
      "7. Active Resume Builder Synchronization (/api/resumes)"
    );
  } catch (err: any) {
    assert(false, "7. Active Resume Builder Synchronization", err.message);
  }

  // 8. Domain Fit Evaluation & Career Guidance
  let jobTargetId = "";
  try {
    const fitRes = await fetch(`${BASE_URL}/api/career/evaluate-fit`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_role: "Principal Cloud Architect",
        target_company: "Amazon Web Services",
        industry: "Cloud Infrastructure",
        job_description:
          "Looking for a Principal Cloud Architect to design enterprise-scale Kubernetes platforms, infrastructure as code using Terraform, and hybrid cloud solutions with high availability.",
      }),
    });
    const fitData = await fitRes.json();
    jobTargetId = fitData.jobTargetId;

    assert(
      fitRes.status === 201 &&
        fitData.success === true &&
        typeof fitData.fitScore === "number" &&
        fitData.fitScore > 0 &&
        fitData.scoreBreakdown.weights.skills === 0.45 &&
        Array.isArray(fitData.matchedSkills) &&
        Array.isArray(fitData.improvementPlan) &&
        fitData.improvementPlan.length > 0,
      "8. Domain Fit Evaluation with Transparent Multi-Factor Breakdown (/api/career/evaluate-fit)",
      `Fit Score: ${fitData.fitScore}% (${fitData.fitCategory})`
    );
  } catch (err: any) {
    assert(false, "8. Domain Fit Evaluation", err.message);
  }

  // 9. Career History Retrieval
  try {
    const histRes = await fetch(`${BASE_URL}/api/career/history`, { headers: authHeaders });
    const histData = await histRes.json();
    assert(
      histRes.status === 200 && Array.isArray(histData) && histData.length > 0,
      "9. Career Evaluation History Retrieval (/api/career/history)"
    );
  } catch (err: any) {
    assert(false, "9. Career Evaluation History", err.message);
  }

  // 10. AI Resume Tailoring (Big Tech / XYZ Formula & ATS Audit)
  let versionId = "";
  try {
    const tailorRes = await fetch(`${BASE_URL}/api/resume/generate-tailored`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_job_title: "Principal Cloud Architect",
        target_company: "AWS",
        company_style: "big_tech",
        job_description:
          "Enterprise Kubernetes platforms, Terraform automated deployment, and high-reliability systems.",
      }),
    });
    const tailorData = await tailorRes.json();
    versionId = tailorData.versionId;

    assert(
      tailorRes.status === 201 &&
        tailorData.success === true &&
        !!versionId &&
        tailorData.tailoredContent.name === "Sarah Connor (Confirmed)" &&
        tailorData.atsChecklist.overall_readiness !== undefined &&
        tailorData.styleRationale.length > 0,
      "10. AI Resume Tailoring (Big Tech Style + ATS Checklist) (/api/resume/generate-tailored)",
      `Readiness: ${tailorData?.atsChecklist?.overall_readiness}`
    );
  } catch (err: any) {
    assert(false, "10. AI Resume Tailoring", err.message);
  }

  // 11. Resume Versions Archive & Restore
  try {
    const versionsRes = await fetch(`${BASE_URL}/api/resume/versions`, { headers: authHeaders });
    const versionsList = await versionsRes.json();

    const restoreRes = await fetch(`${BASE_URL}/api/resume/versions/${versionId}/restore`, {
      method: "POST",
      headers: authHeaders,
    });
    const restoreData = await restoreRes.json();

    assert(
      versionsRes.status === 200 &&
        versionsList.length > 0 &&
        restoreRes.status === 200 &&
        restoreData.success === true,
      "11. Resume Version Archiving & Active Version Restoration (/api/resume/versions)"
    );
  } catch (err: any) {
    assert(false, "11. Resume Version Archiving & Restoration", err.message);
  }

  // 12. Vector A4 PDF Export Pipeline
  try {
    const exportRes = await fetch(`${BASE_URL}/api/resume/export`, {
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

    const pdfArrayBuffer = await exportRes.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const magicBytes = pdfBuffer.toString("utf-8", 0, 5);

    assert(
      exportRes.status === 200 &&
        exportRes.headers.get("content-type") === "application/pdf" &&
        pdfBuffer.length > 1000 &&
        magicBytes === "%PDF-",
      "12. Vector A4 Selectable-Text PDF Export Pipeline (/api/resume/export)",
      `Generated size: ${pdfBuffer.length} bytes, Magic header: ${magicBytes}`
    );
  } catch (err: any) {
    assert(false, "12. Vector PDF Export Pipeline", err.message);
  }

  // 13. Security: Unsupported upload rejection
  try {
    const badFormData = new FormData();
    badFormData.append("file", new Blob(["not a binary"], { type: "text/plain" }), "bad.txt");

    const badRes = await fetch(`${BASE_URL}/api/resume/parse`, {
      method: "POST",
      headers: authHeaders,
      body: badFormData,
    });
    assert(badRes.status === 400, "13. Upload Security rejects unsupported file MIME/extension (400)");
  } catch (err: any) {
    assert(false, "13. Upload Security", err.message);
  }

  console.log("\n==========================================================");
  console.log(`   INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error("Test runner fatal error:", e);
  process.exit(1);
});
