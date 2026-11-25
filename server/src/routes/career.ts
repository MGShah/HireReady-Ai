import { Router } from "express";
import { z } from "zod";
import { ah, AppError } from "../middleware/error";
import { JobTarget } from "../models/JobTarget";
import { ParsedResume } from "../models/ParsedResume";
import { Profile } from "../models/Profile";
import { Resume } from "../models/Resume";
import {
  evaluateFitInputSchema,
  evaluateDomainFitWithAI,
} from "../services/careerFitService";

export const careerRouter = Router();

careerRouter.post(
  "/evaluate-fit",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const body = evaluateFitInputSchema.parse(req.body);

    let candidateProfile = body.candidate_profile;

    // If parsed resume ID provided, load from ParsedResume
    if (body.parsed_resume_id) {
      const parsedDoc = await ParsedResume.findOne({
        _id: body.parsed_resume_id,
        user_id: userId,
      }).lean();

      if (parsedDoc && parsedDoc.structured_data) {
        const d = parsedDoc.structured_data;
        candidateProfile = {
          full_name: d.full_name || candidateProfile?.full_name || "",
          summary: d.summary || candidateProfile?.summary || "",
          skills: Array.from(
            new Set([
              ...(candidateProfile?.skills || []),
              ...(d.hard_skills || []),
              ...(d.soft_skills || []),
            ])
          ),
          experience: (d.experience || []).map((exp) => ({
            company: exp.company,
            role: exp.position,
            position: exp.position,
            dates: exp.dates,
            details: exp.responsibilities.join("\n"),
            responsibilities: exp.responsibilities,
          })),
          education: (d.education || []).map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            graduation_year: edu.graduation_year,
          })),
          domain_specializations: d.domain_specializations || [],
        };
      }
    }

    // If candidateProfile is still empty, auto-populate from User Profile and Active Resume
    if (
      !candidateProfile ||
      (!candidateProfile.skills?.length && !candidateProfile.experience?.length)
    ) {
      const profileDoc = await Profile.findOne({ user_id: userId }).lean();
      const resumeDoc = await Resume.findOne({ user_id: userId }).lean();

      const profileSkills = profileDoc?.skills || [];
      const resumeSkills = resumeDoc?.content?.skills
        ? resumeDoc.content.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      candidateProfile = {
        full_name: profileDoc?.full_name || resumeDoc?.content?.name || "",
        summary: profileDoc?.summary || resumeDoc?.content?.summary || "",
        skills: Array.from(new Set([...profileSkills, ...resumeSkills])),
        experience: (resumeDoc?.content?.experience || []).map((exp) => ({
          company: exp.company,
          role: exp.role,
          position: exp.role,
          dates: exp.dates,
          details: exp.details,
          responsibilities: exp.details ? exp.details.split("\n") : [],
        })),
        education: (resumeDoc?.content?.education || []).map((edu) => ({
          institution: edu.school,
          degree: edu.degree,
          graduation_year: edu.dates,
        })),
        domain_specializations: profileDoc?.domain_specializations || [],
      };
    }

    const targetRole = body.target_job_title || body.target_role;
    const evaluation = await evaluateDomainFitWithAI(userId, {
      ...body,
      target_role: targetRole,
      candidate_profile: candidateProfile,
    });

    // Save record to JobTarget collection
    const jobTargetDoc = await JobTarget.create({
      user_id: userId,
      target_role: targetRole,
      company: body.target_company || "",
      industry: body.industry || "",
      job_description: body.job_description || "",
      required_skills: [
        ...evaluation.matchedSkills,
        ...evaluation.missingSkills.map((m) => m.skill),
      ],
      fit_score: evaluation.fitScore,
      fit_category: evaluation.fitCategory,
      score_breakdown: evaluation.scoreBreakdown,
      matched_skills: evaluation.matchedSkills,
      transferable_skills: evaluation.transferableSkills.map((t) => ({
        skill: t.skill,
        relevance: t.relevance,
        transfer_context: t.transferContext,
      })),
      missing_skills: evaluation.missingSkills,
      experience_alignment: evaluation.experienceAlignment,
      strengths: evaluation.strengths,
      improvement_plan: evaluation.improvementPlan,
      recommended_roles: evaluation.recommendedRoles.map((r) => ({
        role: r.role,
        explanation: r.explanation,
        match_score: r.matchScore,
      })),
      career_advice: evaluation.careerAdvice,
      confidence: evaluation.confidence,
      evaluation_version: "1.0.0",
      created_at: new Date(),
    });

    res.status(201).json({
      success: true,
      jobTargetId: jobTargetDoc._id.toString(),
      ...evaluation,
    });
  })
);

careerRouter.get(
  "/history",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const targets = await JobTarget.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    res.json(
      targets.map((t) => ({
        id: t._id.toString(),
        target_role: t.target_role,
        company: t.company,
        target_company: t.company,
        fit_score: t.fit_score,
        fit_category: t.fit_category,
        confidence: t.confidence,
        created_at: t.created_at,
      }))
    );
  })
);

careerRouter.get(
  "/:id",
  ah(async (req, res) => {
    const userId = req.user!.id;
    const target = await JobTarget.findOne({
      _id: req.params.id,
      user_id: userId,
    }).lean();

    if (!target) {
      throw new AppError(404, "Career evaluation record not found");
    }

    res.json(target);
  })
);
