import { Router } from "express";
import { z } from "zod";
import { ah } from "../middleware/error";
import { Profile } from "../models/Profile";
import { Resume } from "../models/Resume";

const schema = z
  .object({
    full_name: z.string().max(120).optional(),
    education: z.string().max(300).optional(),
    college: z.string().max(200).optional(),
    graduation_year: z.number().int().min(1990).max(2100).optional(),
    skills: z.array(z.string().max(60)).max(80).optional(),
    target_role: z.string().max(120).optional(),
    location: z.string().max(120).optional(),
    phone: z.string().max(40).optional(),
    linkedin: z.string().max(250).optional(),
    github: z.string().max(250).optional(),
    website: z.string().max(250).optional(),
    portfolio: z.string().max(250).optional(),
    summary: z.string().max(2000).optional(),
    domain_specializations: z.array(z.string().max(100)).max(50).optional(),
    certifications: z
      .array(
        z.object({
          name: z.string().max(150),
          issuer: z.string().max(150),
          date: z.string().max(50),
        })
      )
      .max(30)
      .optional(),
    languages: z.array(z.string().max(50)).max(30).optional(),
    accomplishments: z.array(z.string().max(500)).max(50).optional(),
    daily_minutes: z.number().int().min(15).max(480).optional(),
  })
  .strict();

export function calculateProfileScore(p: any): number {
  let score = 0;
  if (p.full_name) score += 15;
  if (p.target_role) score += 15;
  if (p.summary) score += 15;
  if (Array.isArray(p.skills) && p.skills.length > 0) score += 20;
  if (p.education || p.college) score += 10;
  if (p.location || p.phone) score += 5;
  if (p.linkedin || p.github || p.website || p.portfolio) score += 10;
  if (
    (Array.isArray(p.domain_specializations) && p.domain_specializations.length > 0) ||
    (Array.isArray(p.certifications) && p.certifications.length > 0)
  ) {
    score += 10;
  }
  return Math.min(100, score);
}

export const profile = Router();

profile.get(
  "/",
  ah(async (req, res) => {
    let data = await Profile.findOne({ user_id: req.user!.id }).lean();
    if (!data) {
      data = (
        await Profile.create({
          user_id: req.user!.id,
          role: req.user!.role,
          skills: [],
          daily_minutes: 60,
          created_at: new Date(),
          updated_at: new Date(),
        })
      ).toObject();
    }
    res.json(data);
  })
);

profile.put(
  "/",
  ah(async (req, res) => {
    const body = schema.parse(req.body);
    const existing = await Profile.findOne({ user_id: req.user!.id }).lean();
    const merged = { ...(existing || {}), ...body };
    const completionPercentage = calculateProfileScore(merged);

    const updated = await Profile.findOneAndUpdate(
      { user_id: req.user!.id },
      {
        ...body,
        profile_completion_percentage: completionPercentage,
        updated_at: new Date(),
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const resume = await Resume.findOne({ user_id: req.user!.id });
    if (resume) {
      const content = resume.content;
      resume.content = {
        ...content,
        name: body.full_name ?? content.name,
        headline: body.target_role ?? content.headline,
        phone: body.phone ?? content.phone,
        location: body.location ?? content.location,
        website: body.website ?? content.website,
        linkedin: body.linkedin ?? content.linkedin,
        summary: body.summary ?? content.summary,
        skills: body.skills ? body.skills.join(", ") : content.skills,
        education: body.college || body.education || body.graduation_year
          ? [{
              school: body.college ?? content.education[0]?.school ?? "",
              degree: body.education ?? content.education[0]?.degree ?? "",
              dates: body.graduation_year ? String(body.graduation_year) : content.education[0]?.dates ?? "",
            }]
          : content.education,
      };
      resume.updated_at = new Date();
      await resume.save();
    }

    res.json(updated);
  })
);
