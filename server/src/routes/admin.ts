import { Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import os from "os";
import { ah, AppError } from "../middleware/error";
import { requireRole } from "../middleware/auth";
import { env } from "../env";
import { getEffectiveModel } from "../services/ai";
import { getGroqClient } from "../services/groq";
import {
  User,
  Profile,
  Resume,
  ResumeVersion,
  InterviewSession,
  SkillAnalysis,
  Application,
  AiUsageLog,
  SystemSetting,
} from "../models";

export const adminRoutes = Router();

// ============================================================================
// 1. Admin Verification & Bootstrap
// ============================================================================

// Check admin status for the current authenticated user
adminRoutes.get(
  "/check",
  ah(async (req, res) => {
    const isAdmin = req.user?.role === "admin";
    res.json({
      ok: true,
      isAdmin,
      user: req.user,
    });
  })
);

// Check if any admin accounts exist in the system
adminRoutes.get(
  "/bootstrap-status",
  ah(async (_req, res) => {
    const adminCount = await User.countDocuments({ role: "admin" });
    res.json({
      hasAdmin: adminCount > 0,
      adminCount,
    });
  })
);

// Claim first admin if no admin accounts exist yet
adminRoutes.post(
  "/claim-first-admin",
  ah(async (req, res) => {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      throw new AppError(400, "Admin accounts already exist. Bootstrap is disabled.");
    }

    if (!req.user?.id) {
      throw new AppError(401, "You must be logged in to claim administrator privileges.");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { role: "admin" } },
      { returnDocument: "after" }
    );

    await Profile.updateOne(
      { user_id: req.user.id },
      { $set: { role: "admin" } }
    );

    res.json({
      success: true,
      message: "Congratulations! Your account has been promoted to Administrator.",
      user: {
        id: updatedUser?._id,
        email: updatedUser?.email,
        role: updatedUser?.role,
      },
    });
  })
);

// Protect all subsequent admin routes with requireRole("admin")
adminRoutes.use(requireRole("admin"));

// ============================================================================
// 2. High-Precision Stats & Overview
// ============================================================================

adminRoutes.get(
  "/stats",
  ah(async (_req, res) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      verifiedUsers,
      usersLast24h,
      usersLast7d,
      usersLast30d,
      totalProfiles,
      totalResumes,
      totalInterviews,
      completedInterviews,
      activeInterviews,
      totalApplications,
      totalSkills,
      totalAiLogs,
      successAiLogs,
      failedAiLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ emailVerified: true }),
      User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      Profile.countDocuments(),
      Resume.countDocuments(),
      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: "completed" }),
      InterviewSession.countDocuments({ status: "active" }),
      Application.countDocuments(),
      SkillAnalysis.countDocuments(),
      AiUsageLog.countDocuments(),
      AiUsageLog.countDocuments({ success: true }),
      AiUsageLog.countDocuments({ success: false }),
    ]);

    // Aggregate average profile completion
    const profileCompletionAgg = await Profile.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: "$profile_completion_percentage" },
        },
      },
    ]);
    const avgProfileCompletion = Math.round(
      profileCompletionAgg[0]?.avgCompletion || 0
    );

    // Aggregate AI token usage and latency
    const aiMetricsAgg = await AiUsageLog.aggregate([
      {
        $group: {
          _id: null,
          totalRequestTokens: { $sum: { $ifNull: ["$request_tokens", 0] } },
          totalResponseTokens: { $sum: { $ifNull: ["$response_tokens", 0] } },
          avgLatency: { $avg: { $ifNull: ["$latency_ms", 0] } },
        },
      },
    ]);

    const totalPromptTokens = aiMetricsAgg[0]?.totalRequestTokens || 0;
    const totalCompletionTokens = aiMetricsAgg[0]?.totalResponseTokens || 0;
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const avgLatencyMs = Math.round(aiMetricsAgg[0]?.avgLatency || 0);

    // Application status breakdown
    const appStatusAgg = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const applicationsByStatus: Record<string, number> = {
      saved: 0,
      applied: 0,
      assessment: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };
    appStatusAgg.forEach((item) => {
      if (item._id) applicationsByStatus[item._id] = item.count;
    });

    // Interview type breakdown
    const interviewTypeAgg = await InterviewSession.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);
    const interviewsByType: Record<string, number> = {};
    interviewTypeAgg.forEach((item) => {
      if (item._id) interviewsByType[item._id] = item.count;
    });

    // Recent Activity timeline (aggregating latest registrations, applications, interviews, ai errors)
    const [recentUsers, recentApps, recentInts, recentAiLogs] = await Promise.all([
      User.find({}, "email role createdAt isActive")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Application.find({}, "user_id company title status created_at")
        .sort({ created_at: -1 })
        .limit(8)
        .lean(),
      InterviewSession.find({}, "user_id role type difficulty status created_at")
        .sort({ created_at: -1 })
        .limit(8)
        .lean(),
      AiUsageLog.find({}, "user_id feature provider model latency_ms success error_message created_at")
        .sort({ created_at: -1 })
        .limit(8)
        .lean(),
    ]);

    // Map user IDs to emails for context
    const userIds = new Set<string>();
    recentApps.forEach((a) => userIds.add(a.user_id));
    recentInts.forEach((i) => userIds.add(i.user_id));
    recentAiLogs.forEach((l) => userIds.add(l.user_id));

    const userMap = new Map<string, string>();
    if (userIds.size > 0) {
      const usersList = await User.find(
        { _id: { $in: Array.from(userIds).filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
        "email"
      ).lean();
      usersList.forEach((u) => userMap.set(u._id.toString(), u.email));
    }

    const activities: Array<{
      id: string;
      type: "user_registered" | "application_created" | "interview_started" | "ai_invocation";
      title: string;
      description: string;
      timestamp: Date;
      status?: string;
      meta?: any;
    }> = [];

    recentUsers.forEach((u) => {
      activities.push({
        id: `user-${u._id}`,
        type: "user_registered",
        title: "New User Registered",
        description: `${u.email} created an account (${u.role})`,
        timestamp: u.createdAt,
        status: u.isActive ? "active" : "suspended",
        meta: { email: u.email, role: u.role },
      });
    });

    recentApps.forEach((a) => {
      const email = userMap.get(a.user_id) || "Candidate";
      activities.push({
        id: `app-${a._id}`,
        type: "application_created",
        title: "Job Application Logged",
        description: `${email} applied for ${a.title} at ${a.company}`,
        timestamp: a.created_at,
        status: a.status,
        meta: { company: a.company, title: a.title, status: a.status },
      });
    });

    recentInts.forEach((i) => {
      const email = userMap.get(i.user_id) || "Candidate";
      activities.push({
        id: `int-${i._id}`,
        type: "interview_started",
        title: "Mock Interview Started",
        description: `${email} started ${i.difficulty} ${i.type} interview for ${i.role}`,
        timestamp: i.created_at,
        status: i.status,
        meta: { role: i.role, type: i.type, difficulty: i.difficulty },
      });
    });

    recentAiLogs.forEach((l) => {
      const email = userMap.get(l.user_id) || "User";
      activities.push({
        id: `ai-${l._id}`,
        type: "ai_invocation",
        title: l.success ? "AI Query Executed" : "AI Invocations Error",
        description: `${email} invoked ${l.feature} (${l.provider}/${l.model}) in ${l.latency_ms || 0}ms`,
        timestamp: l.created_at,
        status: l.success ? "success" : "error",
        meta: { feature: l.feature, model: l.model, latency: l.latency_ms, error: l.error_message },
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const successRate =
      totalAiLogs > 0 ? Math.round((successAiLogs / totalAiLogs) * 100) : 100;

    res.json({
      counts: {
        users: totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        verifiedUsers,
        usersLast24h,
        usersLast7d,
        usersLast30d,
        profiles: totalProfiles,
        avgProfileCompletion,
        resumes: totalResumes,
        interviews: totalInterviews,
        completedInterviews,
        activeInterviews,
        applications: totalApplications,
        skills: totalSkills,
        aiLogs: totalAiLogs,
        aiSuccess: successAiLogs,
        aiFailed: failedAiLogs,
        aiSuccessRate: successRate,
        aiAvgLatencyMs: avgLatencyMs,
        aiTotalTokens: totalTokens,
        aiPromptTokens: totalPromptTokens,
        aiCompletionTokens: totalCompletionTokens,
      },
      applicationsByStatus,
      interviewsByType,
      recentActivity: activities.slice(0, 20),
    });
  })
);

// ============================================================================
// 3. System & AI Telemetry & Performance
// ============================================================================

adminRoutes.get(
  "/performance",
  ah(async (_req, res) => {
    // 1. Process & Host System telemetry
    const mem = process.memoryUsage();
    const system = {
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      memory: {
        rssMB: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
        heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        externalMB: Math.round((mem.external / 1024 / 1024) * 10) / 10,
        heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      cpus: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    };

    // 2. Database connection status
    const dbStateNames = ["disconnected", "connected", "connecting", "disconnecting"];
    const dbState = mongoose.connection.readyState;
    const database = {
      status: dbStateNames[dbState] || "unknown",
      readyState: dbState,
      host: mongoose.connection.host || "Atlas Cloud",
      name: mongoose.connection.name || "careerpilot",
      modelsLoaded: Object.keys(mongoose.models).length,
    };

    // 3. AI Feature Breakdown
    const featureBreakdownAgg = await AiUsageLog.aggregate([
      {
        $group: {
          _id: "$feature",
          total: { $sum: 1 },
          successCount: { $sum: { $cond: ["$success", 1, 0] } },
          avgLatency: { $avg: { $ifNull: ["$latency_ms", 0] } },
          totalTokens: {
            $sum: {
              $add: [
                { $ifNull: ["$request_tokens", 0] },
                { $ifNull: ["$response_tokens", 0] },
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const featureStats = featureBreakdownAgg.map((item) => ({
      feature: item._id || "general",
      total: item.total,
      successCount: item.successCount,
      successRate: item.total > 0 ? Math.round((item.successCount / item.total) * 100) : 100,
      avgLatencyMs: Math.round(item.avgLatency || 0),
      totalTokens: item.totalTokens,
    }));

    // 4. AI Provider Breakdown
    const providerBreakdownAgg = await AiUsageLog.aggregate([
      {
        $group: {
          _id: "$provider",
          total: { $sum: 1 },
          avgLatency: { $avg: { $ifNull: ["$latency_ms", 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const providerStats = providerBreakdownAgg.map((item) => ({
      provider: item._id || "unknown",
      total: item.total,
      avgLatencyMs: Math.round(item.avgLatency || 0),
    }));

    // 5. Recent latency data points for time-series chart
    const recentLogs = await AiUsageLog.find(
      { latency_ms: { $ne: null } },
      "feature model latency_ms success created_at"
    )
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    const latencyTimeline = recentLogs
      .reverse()
      .map((log) => ({
        time: new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: log.latency_ms || 0,
        feature: log.feature,
        success: log.success,
      }));

    res.json({
      system,
      database,
      ai: {
        activeProvider: env.AI_PROVIDER,
        activeModel: getEffectiveModel(),
        dailyLimit: env.DAILY_AI_LIMIT,
        featureStats,
        providerStats,
        latencyTimeline,
      },
    });
  })
);

// Test database connection ping
adminRoutes.post(
  "/test-db",
  ah(async (_req, res) => {
    const start = Date.now();
    if (!mongoose.connection.db) {
      throw new AppError(500, "Database connection is not initialized");
    }
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;

    res.json({
      success: true,
      latencyMs,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      timestamp: new Date(),
    });
  })
);

// Test AI engine ping
adminRoutes.post(
  "/test-ai",
  ah(async (_req, res) => {
    const start = Date.now();
    const effectiveModel = getEffectiveModel();
    const provider = env.AI_PROVIDER;

    let responseSummary = "AI connection active";
    try {
      if (provider === "groq") {
        const groq = getGroqClient();
        const response = await groq.chat.completions.create({
          model: effectiveModel,
          messages: [
            { role: "system", content: "You are a health ping responder. Respond with valid JSON: {\"ping\":\"pong\",\"status\":\"healthy\"}" },
            { role: "user", content: "ping" },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 30,
        });
        responseSummary = response.choices[0]?.message?.content || "pong";
      } else {
        responseSummary = `Active provider: ${provider}, model: ${effectiveModel}`;
      }

      const latencyMs = Date.now() - start;
      res.json({
        success: true,
        provider,
        model: effectiveModel,
        latencyMs,
        response: responseSummary,
        timestamp: new Date(),
      });
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      res.status(502).json({
        success: false,
        provider,
        model: effectiveModel,
        latencyMs,
        error: err.message || "Failed to reach AI provider",
      });
    }
  })
);

// ============================================================================
// 4. User Management (CRUD)
// ============================================================================

// List users with search, role, status filtering, and pagination
adminRoutes.get(
  "/users",
  ah(async (req, res) => {
    const search = (req.query.search as string) || "";
    const role = (req.query.role as string) || "all";
    const status = (req.query.status as string) || "all";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const filter: Record<string, any> = {};

    if (role === "admin" || role === "user") {
      filter.role = role;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "suspended") {
      filter.isActive = false;
    }

    if (search.trim()) {
      const cleanSearch = search.trim();
      const matchingProfiles = await Profile.find(
        { full_name: { $regex: cleanSearch, $options: "i" } },
        "user_id"
      ).lean();
      const matchedUserIds = matchingProfiles.map((p) => p.user_id);

      filter.$or = [
        { email: { $regex: cleanSearch, $options: "i" } },
        { _id: { $in: matchedUserIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-passwordHash")
      .lean();

    // Populate profiles and activity counts
    const userIds = users.map((u) => u._id.toString());
    const [profiles, resumes, apps, interviews] = await Promise.all([
      Profile.find({ user_id: { $in: userIds } }).lean(),
      Resume.find({ user_id: { $in: userIds } }, "user_id").lean(),
      Application.find({ user_id: { $in: userIds } }, "user_id").lean(),
      InterviewSession.find({ user_id: { $in: userIds } }, "user_id").lean(),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
    const resumeCountMap = new Map<string, number>();
    const appCountMap = new Map<string, number>();
    const interviewCountMap = new Map<string, number>();

    resumes.forEach((r) => resumeCountMap.set(r.user_id, (resumeCountMap.get(r.user_id) || 0) + 1));
    apps.forEach((a) => appCountMap.set(a.user_id, (appCountMap.get(a.user_id) || 0) + 1));
    interviews.forEach((i) => interviewCountMap.set(i.user_id, (interviewCountMap.get(i.user_id) || 0) + 1));

    const enrichedUsers = users.map((u) => {
      const uid = u._id.toString();
      const p = profileMap.get(uid);
      return {
        ...u,
        profile: p
          ? {
              full_name: p.full_name,
              target_role: p.target_role,
              college: p.college,
              education: p.education,
              phone: p.phone,
              skills: p.skills,
              profile_completion_percentage: p.profile_completion_percentage,
            }
          : null,
        counts: {
          resumes: resumeCountMap.get(uid) || 0,
          applications: appCountMap.get(uid) || 0,
          interviews: interviewCountMap.get(uid) || 0,
        },
      };
    });

    res.json({
      users: enrichedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Get single user details with full profile, resumes, applications, interviews
adminRoutes.get(
  "/users/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid User ID format");
    }

    const user = await User.findById(id).select("-passwordHash").lean();
    if (!user) throw new AppError(404, "User not found");

    const [profile, resume, applications, interviews] = await Promise.all([
      Profile.findOne({ user_id: id }).lean(),
      Resume.findOne({ user_id: id }).lean(),
      Application.find({ user_id: id }).sort({ created_at: -1 }).lean(),
      InterviewSession.find({ user_id: id }).sort({ created_at: -1 }).lean(),
    ]);

    res.json({
      user,
      profile,
      resume,
      applications,
      interviews,
    });
  })
);

// Create new user (Admin facility)
adminRoutes.post(
  "/users",
  ah(async (req, res) => {
    const {
      email,
      password,
      role = "user",
      isActive = true,
      emailVerified = true,
      full_name,
      target_role,
      phone,
      college,
      education,
    } = req.body;

    if (!email || !email.includes("@")) {
      throw new AppError(400, "A valid email address is required");
    }
    if (!password || password.length < 6) {
      throw new AppError(400, "Password must be at least 6 characters long");
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      throw new AppError(409, "A user with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const newUser = await User.create({
      email: cleanEmail,
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      isActive: Boolean(isActive),
      emailVerified: Boolean(emailVerified),
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const userIdStr = newUser._id.toString();

    // Create profile
    const profile = await Profile.create({
      user_id: userIdStr,
      role: newUser.role,
      full_name: full_name || null,
      target_role: target_role || null,
      phone: phone || null,
      college: college || null,
      education: education || null,
      skills: [],
      daily_minutes: 60,
      created_at: now,
      updated_at: now,
    });

    // Create default resume
    await Resume.create({
      user_id: userIdStr,
      content: {
        template: "classic",
        name: full_name || "",
        headline: target_role || "",
        email: cleanEmail,
        phone: phone || "",
        location: "",
        summary: `Dedicated ${target_role || "professional"} ready to deliver exceptional results.`,
        skills: "",
        experience: [],
        education: college ? [{ school: college, degree: education || "Degree", dates: "Present" }] : [],
        projects: [],
        certifications: [],
      },
      created_at: now,
      updated_at: now,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
      },
      profile,
    });
  })
);

// Update user details & profile
adminRoutes.put(
  "/users/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid User ID format");
    }

    const {
      email,
      role,
      isActive,
      emailVerified,
      password,
      full_name,
      target_role,
      phone,
      college,
      education,
      skills,
      daily_minutes,
      location,
      summary,
    } = req.body;

    const user = await User.findById(id);
    if (!user) throw new AppError(404, "User not found");

    if (email && email.trim().toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing && existing._id.toString() !== id) {
        throw new AppError(409, "Email is already taken by another account");
      }
      user.email = cleanEmail;
    }

    if (role && (role === "user" || role === "admin")) {
      user.role = role;
    }
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (typeof emailVerified === "boolean") user.emailVerified = emailVerified;
    if (password && password.trim().length >= 6) {
      user.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    user.updatedAt = new Date();
    await user.save();

    // Update profile
    const profileUpdate: Record<string, any> = { updated_at: new Date() };
    if (role) profileUpdate.role = role;
    if (full_name !== undefined) profileUpdate.full_name = full_name;
    if (target_role !== undefined) profileUpdate.target_role = target_role;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (college !== undefined) profileUpdate.college = college;
    if (education !== undefined) profileUpdate.education = education;
    if (Array.isArray(skills)) profileUpdate.skills = skills;
    if (daily_minutes !== undefined) profileUpdate.daily_minutes = daily_minutes;
    if (location !== undefined) profileUpdate.location = location;
    if (summary !== undefined) profileUpdate.summary = summary;

    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: id },
      { $set: profileUpdate },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      message: "User and profile updated successfully",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt,
      },
      profile: updatedProfile,
    });
  })
);

// Quick toggle active / suspended status
adminRoutes.patch(
  "/users/:id/toggle-status",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid User ID format");
    }

    if (req.user?.id === id) {
      throw new AppError(400, "You cannot suspend your own administrative account");
    }

    const user = await User.findById(id);
    if (!user) throw new AppError(404, "User not found");

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${user.isActive ? "Active" : "Suspended"}`,
      isActive: user.isActive,
    });
  })
);

// Quick toggle role between user and admin
adminRoutes.patch(
  "/users/:id/toggle-role",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid User ID format");
    }

    if (req.user?.id === id) {
      throw new AppError(400, "You cannot change your own administrator role here");
    }

    const user = await User.findById(id);
    if (!user) throw new AppError(404, "User not found");

    user.role = user.role === "admin" ? "user" : "admin";
    user.updatedAt = new Date();
    await user.save();

    await Profile.updateOne({ user_id: id }, { $set: { role: user.role } });

    res.json({
      success: true,
      message: `User role updated to ${user.role}`,
      role: user.role,
    });
  })
);

// Delete user and cascade clean-up all associated records
adminRoutes.delete(
  "/users/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid User ID format");
    }

    if (req.user?.id === id) {
      throw new AppError(400, "You cannot delete your own logged-in administrator account");
    }

    const user = await User.findById(id);
    if (!user) throw new AppError(404, "User not found");

    // Cascading delete
    await Promise.all([
      User.findByIdAndDelete(id),
      Profile.deleteMany({ user_id: id }),
      Resume.deleteMany({ user_id: id }),
      ResumeVersion.deleteMany({ user_id: id }),
      Application.deleteMany({ user_id: id }),
      InterviewSession.deleteMany({ user_id: id }),
      SkillAnalysis.deleteMany({ user_id: id }),
      AiUsageLog.deleteMany({ user_id: id }),
    ]);

    res.json({
      success: true,
      message: `User ${user.email} and all associated records deleted successfully`,
    });
  })
);

// ============================================================================
// 5. Job Applications Management (CRUD)
// ============================================================================

// List all applications across candidates
adminRoutes.get(
  "/applications",
  ah(async (req, res) => {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";
    const userId = (req.query.userId as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const filter: Record<string, any> = {};

    if (status !== "all") {
      filter.status = status;
    }

    if (userId) {
      filter.user_id = userId;
    }

    if (search.trim()) {
      filter.$or = [
        { company: { $regex: search.trim(), $options: "i" } },
        { title: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map candidate emails and names
    const userIds = Array.from(new Set(applications.map((a) => a.user_id)));
    const [users, profiles] = await Promise.all([
      User.find({ _id: { $in: userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } }, "email").lean(),
      Profile.find({ user_id: { $in: userIds } }, "user_id full_name").lean(),
    ]);

    const userEmailMap = new Map(users.map((u) => [u._id.toString(), u.email]));
    const profileNameMap = new Map(profiles.map((p) => [p.user_id, p.full_name]));

    const enrichedApps = applications.map((a) => ({
      ...a,
      user_email: userEmailMap.get(a.user_id) || "Unknown User",
      user_name: profileNameMap.get(a.user_id) || "Candidate",
    }));

    res.json({
      applications: enrichedApps,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Create application for a user
adminRoutes.post(
  "/applications",
  ah(async (req, res) => {
    const { user_id, company, title, url, status = "applied", notes } = req.body;
    if (!user_id || !company || !title) {
      throw new AppError(400, "User ID, Company, and Job Title are required");
    }

    const application = await Application.create({
      user_id,
      company: company.trim(),
      title: title.trim(),
      url: url || null,
      status,
      notes: notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Application logged successfully",
      application,
    });
  })
);

// Update application
adminRoutes.put(
  "/applications/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid Application ID");
    }

    const { company, title, url, status, notes } = req.body;
    const application = await Application.findById(id);
    if (!application) throw new AppError(404, "Application not found");

    if (company !== undefined) application.company = company.trim();
    if (title !== undefined) application.title = title.trim();
    if (url !== undefined) application.url = url;
    if (status !== undefined) application.status = status;
    if (notes !== undefined) application.notes = notes;
    application.updated_at = new Date();

    await application.save();

    res.json({
      success: true,
      message: "Application updated successfully",
      application,
    });
  })
);

// Delete application
adminRoutes.delete(
  "/applications/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid Application ID");
    }

    const deleted = await Application.findByIdAndDelete(id);
    if (!deleted) throw new AppError(404, "Application not found");

    res.json({
      success: true,
      message: "Application removed successfully",
    });
  })
);

// ============================================================================
// 6. Profiles & Resumes Management (CRUD)
// ============================================================================

// List candidate profiles
adminRoutes.get(
  "/profiles",
  ah(async (req, res) => {
    const search = (req.query.search as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const filter: Record<string, any> = {};
    if (search.trim()) {
      filter.$or = [
        { full_name: { $regex: search.trim(), $options: "i" } },
        { target_role: { $regex: search.trim(), $options: "i" } },
        { college: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total = await Profile.countDocuments(filter);
    const profiles = await Profile.find(filter)
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = profiles.map((p) => p.user_id);
    const users = await User.find(
      { _id: { $in: userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      "email"
    ).lean();
    const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    const enrichedProfiles = profiles.map((p) => ({
      ...p,
      email: emailMap.get(p.user_id) || "Unknown",
    }));

    res.json({
      profiles: enrichedProfiles,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Update profile
adminRoutes.put(
  "/profiles/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid ID format");
    const update = { ...req.body, updated_at: new Date() };
    delete update._id;
    delete update.user_id;

    const profile = await Profile.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" });
    if (!profile) throw new AppError(404, "Profile not found");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  })
);

// List resumes
adminRoutes.get(
  "/resumes",
  ah(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const total = await Resume.countDocuments();
    const resumes = await Resume.find()
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = resumes.map((r) => r.user_id);
    const users = await User.find(
      { _id: { $in: userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      "email"
    ).lean();
    const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    const enrichedResumes = resumes.map((r) => ({
      ...r,
      email: emailMap.get(r.user_id) || r.content?.email || "Unknown",
      candidate_name: r.content?.name || "Untitled",
      headline: r.content?.headline || "",
      template: r.content?.template || "classic",
    }));

    res.json({
      resumes: enrichedResumes,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Delete resume
adminRoutes.delete(
  "/resumes/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid ID format");
    const deleted = await Resume.findByIdAndDelete(id);
    if (!deleted) throw new AppError(404, "Resume not found");

    res.json({
      success: true,
      message: "Resume deleted successfully",
    });
  })
);

// ============================================================================
// 7. Mock Interview Sessions Management (CRUD)
// ============================================================================

// List interview sessions
adminRoutes.get(
  "/interviews",
  ah(async (req, res) => {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";
    const type = (req.query.type as string) || "all";
    const difficulty = (req.query.difficulty as string) || "all";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const filter: Record<string, any> = {};

    if (status !== "all") filter.status = status;
    if (type !== "all") filter.type = type;
    if (difficulty !== "all") filter.difficulty = difficulty;
    if (search.trim()) {
      filter.role = { $regex: search.trim(), $options: "i" };
    }

    const total = await InterviewSession.countDocuments(filter);
    const interviews = await InterviewSession.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-messages")
      .lean();

    const userIds = interviews.map((i) => i.user_id);
    const users = await User.find(
      { _id: { $in: userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      "email"
    ).lean();
    const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    const enrichedInterviews = interviews.map((i) => ({
      ...i,
      email: emailMap.get(i.user_id) || "Candidate",
    }));

    res.json({
      interviews: enrichedInterviews,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Get single interview session with messages and feedback
adminRoutes.get(
  "/interviews/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid Interview ID");
    }

    const interview = await InterviewSession.findById(id).lean();
    if (!interview) throw new AppError(404, "Interview session not found");

    const user = await User.findById(interview.user_id, "email").lean();

    res.json({
      interview: {
        ...interview,
        email: user?.email || "Candidate",
      },
    });
  })
);

// Update interview session
adminRoutes.put(
  "/interviews/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid ID format");
    const { status, difficulty, role, question_count } = req.body;

    const interview = await InterviewSession.findById(id);
    if (!interview) throw new AppError(404, "Interview session not found");

    if (status) interview.status = status;
    if (difficulty) interview.difficulty = difficulty;
    if (role) interview.role = role;
    if (question_count) interview.question_count = question_count;

    await interview.save();

    res.json({
      success: true,
      message: "Interview session updated successfully",
      interview,
    });
  })
);

// Delete interview session
adminRoutes.delete(
  "/interviews/:id",
  ah(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid ID format");
    const deleted = await InterviewSession.findByIdAndDelete(id);
    if (!deleted) throw new AppError(404, "Interview session not found");

    res.json({
      success: true,
      message: "Interview session deleted successfully",
    });
  })
);

// ============================================================================
// 8. AI Usage Logs & System Audit
// ============================================================================

// List AI logs with filtering
adminRoutes.get(
  "/ai-logs",
  ah(async (req, res) => {
    const feature = (req.query.feature as string) || "all";
    const provider = (req.query.provider as string) || "all";
    const success = (req.query.success as string) || "all";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));

    const filter: Record<string, any> = {};

    if (feature !== "all") filter.feature = feature;
    if (provider !== "all") filter.provider = provider;
    if (success === "true") filter.success = true;
    else if (success === "false") filter.success = false;

    const total = await AiUsageLog.countDocuments(filter);
    const logs = await AiUsageLog.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = Array.from(new Set(logs.map((l) => l.user_id)));
    const users = await User.find(
      { _id: { $in: userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      "email"
    ).lean();
    const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    const enrichedLogs = logs.map((l) => ({
      ...l,
      email: emailMap.get(l.user_id) || "Anonymous/System",
    }));

    res.json({
      logs: enrichedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

// Delete or prune AI logs
adminRoutes.delete(
  "/ai-logs",
  ah(async (req, res) => {
    const days = parseInt(req.query.days as string) || 0;
    let filter: Record<string, any> = {};

    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filter = { created_at: { $lt: cutoff } };
    }

    const result = await AiUsageLog.deleteMany(filter);

    res.json({
      success: true,
      message: `Pruned ${result.deletedCount} AI usage log records`,
      deletedCount: result.deletedCount,
    });
  })
);

// ============================================================================
// 9. System Settings & Global Announcement
// ============================================================================

// Get system settings
adminRoutes.get(
  "/settings",
  ah(async (_req, res) => {
    const [announcementSetting, maintenanceSetting] = await Promise.all([
      SystemSetting.findOne({ key: "announcement" }).lean(),
      SystemSetting.findOne({ key: "maintenance" }).lean(),
    ]);

    res.json({
      announcement: announcementSetting?.value || { active: false, text: "", type: "info" },
      maintenance: maintenanceSetting?.value || { active: false, message: "" },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        port: env.PORT,
        frontendUrl: env.FRONTEND_URL,
        aiProvider: env.AI_PROVIDER,
        aiModel: env.AI_MODEL || "Default Model",
        dailyAiLimit: env.DAILY_AI_LIMIT,
        database: "MongoDB Atlas",
        hasGroqKey: Boolean(env.GROQ_API_KEY),
        hasGeminiKey: Boolean(env.GEMINI_API_KEY),
        hasOpenAiKey: Boolean(env.OPENAI_API_KEY),
        hasHfToken: Boolean(env.HF_TOKEN),
      },
    });
  })
);

// Update system settings (Announcement, Maintenance, etc.)
adminRoutes.post(
  "/settings",
  ah(async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      throw new AppError(400, "Setting key and value are required");
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          value,
          updated_at: new Date(),
          updated_by: req.user?.id || null,
        },
      },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      message: `System setting '${key}' updated successfully`,
      setting,
    });
  })
);

// View collection schemas and metadata (preserved for reference)
adminRoutes.get(
  "/collections",
  ah(async (_req, res) => {
    const collections = [
      {
        name: "users",
        count: await User.countDocuments(),
        description: "Registered user accounts, credentials, and authentication state",
      },
      {
        name: "profiles",
        count: await Profile.countDocuments(),
        description: "User profiles, education, target roles, contact info, and learning targets",
      },
      {
        name: "resumes",
        count: await Resume.countDocuments(),
        description: "ATS-formatted resume data, templates, experience, projects, and certifications",
      },
      {
        name: "interviewSessions",
        count: await InterviewSession.countDocuments(),
        description: "Role-based AI interview sessions, difficulty, and conversation turns",
      },
      {
        name: "skillAnalyses",
        count: await SkillAnalysis.countDocuments(),
        description: "Candidate skill evaluations against target roles and job descriptions",
      },
      {
        name: "applications",
        count: await Application.countDocuments(),
        description: "Job application pipeline tracking from saved to offer/rejected",
      },
      {
        name: "aiUsageLogs",
        count: await AiUsageLog.countDocuments(),
        description: "AI invocation logs, rate limits, latency, and token consumption",
      },
      {
        name: "systemSettings",
        count: await SystemSetting.countDocuments(),
        description: "Global system announcement, runtime settings, and platform configuration",
      },
    ];

    res.json({ collections });
  })
);
