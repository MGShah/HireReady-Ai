import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { Resume } from "../models/Resume";
import { AppError, ah } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  full_name: z.string().max(120).optional(),
  target_role: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  college: z.string().max(200).optional(),
  education: z.string().max(300).optional(),
  graduation_year: z.number().int().min(1990).max(2100).optional(),
  skills: z.array(z.string().max(60)).optional().default([]),
  linkedin: z.string().max(250).optional(),
  website: z.string().max(250).optional(),
  summary: z.string().max(2000).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/register",
  ah(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const cleanEmail = body.email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      throw new AppError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const now = new Date();

    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      role: "user",
      isActive: true,
      emailVerified: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const userIdStr = user._id.toString();

    // Create profile
    const profile = await Profile.create({
      user_id: userIdStr,
      role: "user",
      full_name: body.full_name || null,
      education: body.education || null,
      college: body.college || null,
      graduation_year: body.graduation_year || null,
      skills: body.skills ?? [],
      target_role: body.target_role || null,
      location: body.location || null,
      phone: body.phone || null,
      linkedin: body.linkedin || null,
      website: body.website || null,
      summary: body.summary || null,
      daily_minutes: 60,
      created_at: now,
      updated_at: now,
    });

    // Create initial pre-filled resume
    const defaultSummary =
      body.summary ||
      (body.target_role
        ? `Dedicated ${body.target_role} with expertise in ${
            body.skills.length ? body.skills.join(", ") : "modern technologies"
          }. Focused on continuous learning and impactful delivery.`
        : "");

    await Resume.create({
      user_id: userIdStr,
      content: {
        template: "classic",
        name: body.full_name || "",
        headline: body.target_role || "",
        email: user.email,
        phone: body.phone || "",
        location: body.location || "",
        website: body.website || "",
        linkedin: body.linkedin || "",
        summary: defaultSummary,
        skills: body.skills.join(", "),
        achievements: "",
        languages: "English",
        customTitle: "",
        customContent: "",
        experience: [
          {
            company: "",
            role: body.target_role || "Recent Role",
            dates: "Present",
            details: "Key achievements, responsibilities, and delivered projects.",
          },
        ],
        education: [
          {
            school: body.college || "University / College",
            degree: body.education || "Degree / Program",
            dates: body.graduation_year ? String(body.graduation_year) : "Graduation Year",
          },
        ],
        projects: [],
        certifications: [],
      },
      created_at: now,
      updated_at: now,
    });

    const token = jwt.sign(
      { userId: userIdStr, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: userIdStr,
        email: user.email,
        role: user.role,
        user_metadata: {
          full_name: profile.full_name,
          target_role: profile.target_role,
          headline: profile.target_role,
          phone: profile.phone,
          location: profile.location,
          college: profile.college,
          education: profile.education,
          graduation_year: profile.graduation_year,
          skills: profile.skills,
          linkedin: profile.linkedin,
          summary: profile.summary,
        },
      },
      profile,
    });
  })
);

authRouter.post(
  "/login",
  ah(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw new AppError(
        404,
        "No account found with this email in the MongoDB database. Please create an account to get started."
      );
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError(400, "Incorrect password. Please verify your password and try again.");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const userIdStr = user._id.toString();
    const profile = await Profile.findOne({ user_id: userIdStr }).lean();

    const token = jwt.sign(
      { userId: userIdStr, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: userIdStr,
        email: user.email,
        role: user.role,
        user_metadata: profile
          ? {
              full_name: profile.full_name,
              target_role: profile.target_role,
              headline: profile.target_role,
              phone: profile.phone,
              location: profile.location,
              college: profile.college,
              education: profile.education,
              graduation_year: profile.graduation_year,
              skills: profile.skills,
              linkedin: profile.linkedin,
              summary: profile.summary,
            }
          : {},
      },
      profile,
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  ah(async (req, res) => {
    const userId = req.user!.id;
    const user = await User.findById(userId).lean();
    if (!user) throw new AppError(404, "User not found");

    const profile = await Profile.findOne({ user_id: userId }).lean();

    res.json({
      user: {
        id: userId,
        email: user.email,
        role: user.role,
        user_metadata: profile
          ? {
              full_name: profile.full_name,
              target_role: profile.target_role,
              headline: profile.target_role,
              phone: profile.phone,
              location: profile.location,
              college: profile.college,
              education: profile.education,
              graduation_year: profile.graduation_year,
              skills: profile.skills,
              linkedin: profile.linkedin,
              summary: profile.summary,
            }
          : {},
      },
      profile,
    });
  })
);

authRouter.post(
  "/logout",
  ah(async (_req, res) => {
    res.json({ ok: true });
  })
);
