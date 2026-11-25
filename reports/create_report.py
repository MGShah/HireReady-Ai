from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
)


ROOT = Path(r"D:\careerpilot (5)\careerpilot (5)\careerpilot (4)\careerpilot\hireReady-AI")
ASSETS = ROOT / "report-assets"
OUTPUT = ROOT / "reports" / "hireReady-AI_project_report.pdf"

PAGE_W, PAGE_H = A4
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#5B6475")
PURPLE = colors.HexColor("#5546E8")
LIGHT = colors.HexColor("#F3F4FF")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9DDF0"))
    canvas.line(42, 34, PAGE_W - 42, 34)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(42, 21, "hireReady-AI | Project Report")
    canvas.drawRightString(PAGE_W - 42, 21, f"Page {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=30, leading=36, textColor=INK, alignment=TA_CENTER, spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="CoverSub", parent=styles["Normal"], fontName="Helvetica",
    fontSize=14, leading=20, textColor=MUTED, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=20, leading=25, textColor=INK, spaceBefore=8, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=13, leading=17, textColor=PURPLE, spaceBefore=8, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Bodyx", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=9.5, leading=14, textColor=INK, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="Smallx", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=8, leading=11, textColor=MUTED, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="Captionx", parent=styles["BodyText"], fontName="Helvetica-Oblique",
    fontSize=8, leading=10, textColor=MUTED, alignment=TA_CENTER, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="Bulletx", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=9.2, leading=13, textColor=INK, leftIndent=12, firstLineIndent=-8,
    bulletIndent=0, spaceAfter=4,
))


def p(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"• {text}", styles["Bulletx"])


def screenshot(name, caption, width=6.7 * inch):
    path = ASSETS / name
    if not path.exists():
        return []
    image = Image(str(path))
    ratio = width / image.imageWidth
    image.drawWidth = width
    image.drawHeight = image.imageHeight * ratio
    return [image, p(caption, "Captionx")]


story = []
story.extend([
    Spacer(1, 0.8 * inch),
    p("hireReady-AI", "CoverTitle"),
    p("When Talent Meets Intelligence", "CoverSub"),
    Spacer(1, 0.25 * inch),
    p("Full-Stack Career Acceleration Platform", "CoverSub"),
    Spacer(1, 0.4 * inch),
    p("Project Review & Demonstration Report", "H1x"),
    Spacer(1, 0.25 * inch),
    p("Prepared on 21 November 2026", "CoverSub"),
    Spacer(1, 0.55 * inch),
    p("A documented review of the public experience, authenticated career workspace, AI-assisted workflows, database-backed services, and administrator control center.", "Bodyx"),
    Spacer(1, 0.35 * inch),
])

team = [
    ["Member", "Responsibility"],
    ["Shah Mahek", "Frontend development"],
    ["Ambaliya Ajay", "Database integration"],
    ["Thakkar Bansi", "LLM model integration"],
    ["Chovatiya Rishit", "Backend development"],
]
table = Table(team, colWidths=[2.1 * inch, 4.5 * inch], repeatRows=1)
table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9DDF0")),
    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.extend([table, PageBreak()])

story.extend([
    p("1. Executive Summary", "H1x"),
    p("hireReady-AI is a full-stack career acceleration application that combines ATS-friendly resume creation, AI interview practice, domain-fit analysis, application tracking, profile management, and an administrator operations portal. The live review confirmed a cohesive dark-themed interface with responsive navigation, protected routes, MongoDB-backed data, JWT authentication, and AI-provider telemetry.", "Bodyx"),
    p("The project is structured as a Vite/React client and a TypeScript/Express server in a workspace monorepo. The backend connects to MongoDB and exposes feature-specific routes for authentication, resumes, interviews, skills, applications, profile data, AI operations, and admin management.", "Bodyx"),
    p("Review outcome: the principal user and admin flows are implemented and visually coherent. The environment was brought to a runnable state by restoring the declared npm dependencies; the backend then connected successfully to MongoDB and served the API on port 5001.", "Bodyx"),
    p("2. Product Objectives", "H1x"),
    bullet("Reduce the time required to create and maintain a professional, ATS-compatible resume."),
    bullet("Provide realistic, role-specific mock interview practice with adaptive AI feedback."),
    bullet("Translate a target role or job description into transparent fit scoring, skill gaps, and an improvement roadmap."),
    bullet("Give candidates a visual pipeline for saved jobs, applications, assessments, interviews, offers, and outcomes."),
    bullet("Provide administrators with operational visibility into users, applications, interviews, AI usage, database status, and system settings."),
    p("3. Team Ownership", "H1x"),
    p("The ownership model supplied for this report maps naturally to the project structure:", "Bodyx"),
])
story.append(table)
story.extend([
    p("4. Technology & Architecture", "H1x"),
    p("<b>Frontend:</b> React 18, TypeScript, Vite, TailwindCSS, React Router, Lucide icons, Recharts, and Capacitor for Android/PWA packaging.", "Bodyx"),
    p("<b>Backend:</b> Node.js, Express, TypeScript, Zod validation, JWT authentication, bcrypt password hashing, Helmet, CORS, rate limiting, Multer, PDFKit, Mammoth, and pdf-parse.", "Bodyx"),
    p("<b>Data & AI:</b> MongoDB with Mongoose models and validation; Groq/OpenAI-compatible model integration, Hugging Face support, AI usage logs, and provider performance reporting.", "Bodyx"),
    p("<b>Application flow:</b> the React client calls authenticated Express routes. The server validates input, applies auth/role middleware, persists documents in MongoDB, calls AI providers where required, and returns structured JSON or generated PDF output.", "Bodyx"),
    p("5. Feature Inventory", "H1x"),
    bullet("<b>Landing page:</b> product positioning, feature cards, onboarding promise, ATS-ready resume preview, and account entry points."),
    bullet("<b>Authentication:</b> login and two-step signup wizard collecting resume-ready personal, education, target-role, and skills data."),
    bullet("<b>Career dashboard:</b> profile readiness, application/interview/skill metrics, next-best action, AI Copilot, activity, and milestones."),
    bullet("<b>Resume Studio:</b> PDF/DOCX upload, AI extraction, ATS status, templates, tailoring, version history, profile sync, print preview, and vector PDF download."),
    bullet("<b>Interview Lab:</b> target role, round focus, difficulty, question count, adaptive coaching, and session privacy messaging."),
    bullet("<b>Domain Fit Analysis:</b> job title, company, industry, job-description input, multi-factor evaluation, transferable skills, gaps, and roadmap."),
    bullet("<b>Application Pipeline:</b> opportunity entry with company, title, URL, notes, and stage-based visual tracking."),
    bullet("<b>Profile:</b> personal information, career field, location, daily learning time, education, and skills with resume synchronization."),
    bullet("<b>Admin Portal:</b> overview analytics, user CRUD, application CRUD, interview/resume management, AI telemetry, database/AI test actions, announcements, and settings."),
])

story.extend([PageBreak(), p("6. Live Screenshots & Demonstrated Workflows", "H1x")])
story.extend(screenshot("landing-public.png", "Figure 1. Public landing page with product hero, feature positioning, and ATS preview."))
story.extend(screenshot("login-public.png", "Figure 2. Authentication screen showing direct resume pre-fill, ATS templates, and AI coaching value propositions."))
story.extend(screenshot("dashboard.png", "Figure 3. Authenticated career dashboard with readiness metrics, AI Copilot, and career actions."))
story.extend(screenshot("resume.png", "Figure 4. Resume Studio with upload/extraction, ATS status, tailoring controls, and interactive A4 document preview."))
story.extend(screenshot("interview.png", "Figure 5. Interview Lab configuration for role, round focus, difficulty, and question count."))

story.extend([PageBreak()])
story.extend(screenshot("skills.png", "Figure 6. Domain Fit Analysis form for transparent job alignment and skill-gap guidance."))
story.extend(screenshot("applications.png", "Figure 7. Candidate application pipeline with opportunity entry and stage columns."))
story.extend(screenshot("profile.png", "Figure 8. Career profile editor with profile strength, education, and toolkit sections."))
story.extend(screenshot("admin-overview.png", "Figure 9. Admin overview showing database connection, AI engine, uptime, metrics, and analytics."))
story.extend(screenshot("admin-users.png", "Figure 10. Admin user management with role/status filters and CRUD entry point."))
story.extend(screenshot("admin-applications.png", "Figure 11. Admin application management with search, stage filtering, editing, and deletion controls."))

story.extend([
    PageBreak(),
    p("7. Database & API Coverage", "H1x"),
    p("The repository defines MongoDB collections for users, profiles, resumes, interview sessions, skill analyses, applications, AI usage logs, parsed resumes, job targets, resume versions, and system settings. This supports both candidate workflows and operational reporting without collapsing unrelated data into a single document.", "Bodyx"),
    p("Key server capabilities include registration/login/me endpoints, resume parse and confirmation, tailored resume generation, resume version restore, vector PDF export, career-fit evaluation/history/details, interview lifecycle, application CRUD, profile synchronization, AI assistant requests, public announcements, and admin statistics/management.", "Bodyx"),
    p("8. Quality & Verification Notes", "H1x"),
    bullet("The client production build and server test/build scripts are defined in the workspace package manifests."),
    bullet("The live development environment was started with the workspace dev command; the client served on port 5173 and the API on port 5001."),
    bullet("MongoDB reported a successful connection during the review, and the admin portal displayed a connected database state."),
    bullet("The seeded administrator route was verified through login and the admin portal; no credentials are included in this report."),
    bullet("Repeated automated refreshes can trigger the configured API rate limiter (HTTP 429); this is expected protection behavior and should be considered when designing automated demonstrations."),
    bullet("The npm install output reported dependency audit findings and several deprecated packages. These are maintenance follow-ups, not blockers to the demonstrated flows."),
    p("9. Conclusion", "H1x"),
    p("hireReady-AI presents a complete, well-scoped career platform rather than a single-purpose resume tool. Its strongest differentiators are the direct signup-to-resume handoff, role-specific AI coaching, transparent domain-fit model, and the operational depth of the admin portal. The current implementation is suitable for a project demonstration and provides a clear foundation for further hardening, observability, and production deployment.", "Bodyx"),
    p("Recommended next steps: add formal end-to-end coverage for the main authenticated workflows, document production environment variables and deployment runbooks, review rate-limit thresholds for automated clients, and plan dependency maintenance upgrades.", "Bodyx"),
])

doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=42,
    leftMargin=42,
    topMargin=42,
    bottomMargin=48,
    title="hireReady-AI Project Report",
    author="hireReady-AI Team",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
