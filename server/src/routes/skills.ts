import { Router } from "express";
import { z } from "zod";
import { ah } from "../middleware/error";
import { askJson } from "../services/ai";
import { SkillAnalysis } from "../models/SkillAnalysis";
import { Profile } from "../models/Profile";
import { generateSkillGapRoadmap } from "../services/aiIntelligence";

const schema = z.object({
  target_role: z.string().min(1).max(120),
  job_description: z.string().max(8000).optional(),
  candidate_skills: z.array(z.string().max(120)).max(100).optional(),
  resume_context: z.object({
    summary: z.string().max(5000).optional(),
    experience: z.array(z.object({
      role: z.string().max(200).optional(),
      company: z.string().max(200).optional(),
      details: z.string().max(5000).optional(),
    })).max(20).optional(),
    education: z.array(z.object({
      degree: z.string().max(200).optional(),
      school: z.string().max(200).optional(),
    })).max(10).optional(),
  }).optional(),
});

export interface SkillItem {
  skill: string;
  status: "demonstrated" | "partial" | "unverified";
  evidence: string;
  required_level: string;
}

export interface SkillResult {
  skills: SkillItem[];
}

const skillItemSchema: z.ZodType<SkillItem> = z.object({
  skill: z.string(),
  status: z.enum(["demonstrated", "partial", "unverified"]),
  evidence: z.string(),
  required_level: z.string(),
});

const result: z.ZodType<SkillResult> = z.object({
  skills: z.array(skillItemSchema),
});

export const skills = Router();

skills.get(
  "/",
  ah(async (req, res) => {
    const list = await SkillAnalysis.find({ user_id: req.user!.id })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    res.json(list.map((h) => ({ ...h, id: h._id.toString() })));
  })
);

skills.post(
  "/",
  ah(async (req, res) => {
    const b = schema.parse(req.body);
    const uid = req.user!.id;

    const p = await Profile.findOne({ user_id: uid }).lean();
    const owned: string[] = Array.from(new Set([...(p?.skills ?? []), ...(b.candidate_skills ?? [])]));

    const dynamicAnalysis = generateSkillGapRoadmap(b.target_role, owned, b.resume_context);

    const { data, demo } = await askJson(
      uid,
      "skill_gap",
      result,
      "Compare the candidate's resume and profile to the target role. Use resume skills, experience, education, and summary as evidence. A skill missing from the submitted information is 'unverified', never 'absent'. Keep recommendations relevant to the target industry and do not inject software skills into non-technical roles.",
      `Role: ${b.target_role}\nJob description: ${
        b.job_description ?? "n/a"
      }\nCandidate skills: ${owned.join(", ") || "none listed"}\nResume context: ${JSON.stringify(b.resume_context ?? {})}`,
      {
        skills: dynamicAnalysis.skills,
      }
    );

    const saved = await SkillAnalysis.create({
      user_id: uid,
      target_role: b.target_role,
      job_description: b.job_description || null,
      result: data,
      demo,
      created_at: new Date(),
    });

    res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString(),
      disclaimer: "AI evaluation comparing target industry standards with profile competencies.",
      roadmap: dynamicAnalysis.learningRoadmap,
      demo,
    });
  })
);
