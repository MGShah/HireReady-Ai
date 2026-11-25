import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import {
  User,
  Profile,
  Resume,
  InterviewSession,
  SkillAnalysis,
  Application,
  AiUsageLog,
} from "../models";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";

async function runTest() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  const testEmail = `test_${Date.now()}@example.com`;
  const password = "password123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  console.log("1. Creating test user in 'users' collection...");
  const user = await User.create({
    email: testEmail,
    passwordHash,
    role: "user",
    isActive: true,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ User created:", user._id.toString(), user.email);

  console.log("2. Creating profile in 'profiles' collection...");
  const profile = await Profile.create({
    user_id: user._id.toString(),
    role: "user",
    full_name: "Alex Doe",
    education: "B.Tech Computer Science",
    college: "Stanford University",
    graduation_year: 2025,
    skills: ["React", "TypeScript", "Node.js", "MongoDB"],
    target_role: "Full Stack Engineer",
    location: "San Francisco, CA",
    phone: "+1 555-0199",
    linkedin: "linkedin.com/in/alexdoe",
    website: "https://alexdoe.dev",
    summary: "Dedicated software engineer passionate about modern web technologies.",
    daily_minutes: 60,
    created_at: now,
    updated_at: now,
  });
  console.log("✓ Profile created with frontend fields:", profile.full_name, profile.skills);

  console.log("3. Creating resume in 'resumes' collection...");
  const resume = await Resume.create({
    user_id: user._id.toString(),
    content: {
      template: "modern",
      name: profile.full_name || "",
      headline: profile.target_role || "",
      email: user.email,
      phone: profile.phone || "",
      location: profile.location || "",
      website: profile.website || "",
      linkedin: profile.linkedin || "",
      summary: profile.summary || "",
      skills: profile.skills.join(", "),
      achievements: "Built high-throughput microservices",
      languages: "English",
      customTitle: "",
      customContent: "",
      experience: [
        {
          company: "Tech Corp",
          role: "Frontend Engineer",
          dates: "2023 - Present",
          details: "Architected modern dashboard UI using React & TypeScript.",
        },
      ],
      education: [
        {
          school: profile.college || "",
          degree: profile.education || "",
          dates: "2025",
        },
      ],
      projects: [
        {
          name: "CareerPilot",
          link: "https://github.com",
          details: "AI-driven career accelerator",
        },
      ],
      certifications: [],
    },
    created_at: now,
    updated_at: now,
  });
  console.log("✓ Resume created with rich template content:", resume.content.headline);

  console.log("4. Creating application in 'applications' collection...");
  const app = await Application.create({
    user_id: user._id.toString(),
    company: "Google",
    title: "Software Engineer",
    url: "https://careers.google.com",
    status: "applied",
    notes: "Applied via referral",
    created_at: now,
    updated_at: now,
  });
  console.log("✓ Application created:", app.company, app.title);

  console.log("5. Creating interview session in 'interviewSessions' collection...");
  const interview = await InterviewSession.create({
    user_id: user._id.toString(),
    role: "Full Stack",
    type: "technical",
    difficulty: "medium",
    question_count: 5,
    status: "active",
    demo: true,
    messages: [
      {
        role: "assistant",
        content: "What is the difference between SQL and NoSQL databases?",
        created_at: now,
      },
      {
        role: "user",
        content: "SQL is relational with fixed schemas, NoSQL like MongoDB is document-based and flexible.",
        feedback: {
          correctness: 9,
          relevance: 9,
          clarity: 9,
          missing: [],
          example: "Good explanation.",
        },
        created_at: new Date(now.getTime() + 1000),
      },
    ],
    created_at: now,
  });
  console.log("✓ Interview session created with messages:", interview.role, interview.messages.length, "messages");

  console.log("6. Creating skill analysis in 'skillAnalyses' collection...");
  const analysis = await SkillAnalysis.create({
    user_id: user._id.toString(),
    target_role: "Full Stack Developer",
    job_description: "Requires React, Node, and MongoDB",
    result: {
      skills: [
        {
          skill: "React",
          status: "demonstrated",
          evidence: "Listed on profile",
          required_level: "High",
        },
        {
          skill: "MongoDB",
          status: "demonstrated",
          evidence: "Listed on profile",
          required_level: "Medium",
        },
      ],
    },
    demo: true,
    created_at: now,
  });
  console.log("✓ Skill analysis created:", analysis.target_role, analysis.result.skills.length, "skills");

  console.log("7. Creating AI usage log in 'aiUsageLogs' collection...");
  const log = await AiUsageLog.create({
    user_id: user._id.toString(),
    feature: "interview_eval",
    provider: "groq",
    model: "llama-3.1-70b-versatile",
    created_at: now,
    success: true,
  });
  console.log("✓ AI usage log created:", log.feature, log.provider);

  console.log("8. Generating and verifying JWT token...");
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const decoded = jwt.verify(token, env.JWT_SECRET) as any;
  console.log("✓ JWT valid for:", decoded.email, "role:", decoded.role);

  console.log("9. Counting documents in MongoDB...");
  const counts = {
    users: await User.countDocuments(),
    profiles: await Profile.countDocuments(),
    resumes: await Resume.countDocuments(),
    applications: await Application.countDocuments(),
    interviewSessions: await InterviewSession.countDocuments(),
    skillAnalyses: await SkillAnalysis.countDocuments(),
    aiUsageLogs: await AiUsageLog.countDocuments(),
  };
  console.log("✓ MongoDB collection counts:", counts);

  console.log("10. Cleaning up test data...");
  await User.deleteOne({ _id: user._id });
  await Profile.deleteOne({ _id: profile._id });
  await Resume.deleteOne({ _id: resume._id });
  await Application.deleteOne({ _id: app._id });
  await InterviewSession.deleteOne({ _id: interview._id });
  await SkillAnalysis.deleteOne({ _id: analysis._id });
  await AiUsageLog.deleteOne({ _id: log._id });
  console.log("✓ Cleaned up test documents.");

  await mongoose.disconnect();
  console.log("ALL TESTS PASSED SUCCESSFULLY! MongoDB is 100% operational.");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
