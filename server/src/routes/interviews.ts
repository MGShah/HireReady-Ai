import { Router } from "express";
import { z } from "zod";
import { AppError, ah } from "../middleware/error";
import { askJson } from "../services/ai";
import { InterviewSession } from "../models/InterviewSession";
import {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
} from "../services/aiIntelligence";

type Msg = { role: string; content: string };
const SYS =
  "You are a role-specific interview checkpoint evaluator. Ask only questions grounded in the selected target role, its domain, the candidate evidence, and the selected checkpoint type. Do not ask behavioral, HR, culture-fit, motivation, or generic software questions. Score correctness, role relevance, and clarity from 0-10, identify role-specific omissions, and provide a role-specific model answer.";

const startSchema = z.object({
  role: z.string().min(1).max(80),
  type: z.enum(["technical", "coding", "project"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question_count: z.number().int().min(1).max(15),
  candidate_skills: z.array(z.string().max(120)).max(100).optional(),
  resume_context: z.object({
    summary: z.string().max(5000).optional(),
    experience: z.array(z.object({
      role: z.string().max(200).optional(),
      details: z.string().max(5000).optional(),
    })).max(20).optional(),
  }).optional(),
});

export interface FeedbackData {
  correctness: number;
  relevance: number;
  clarity: number;
  missing: string[];
  example: string;
}

export interface EvalOutput {
  feedback: FeedbackData;
  nextQuestion: string | null;
}

const feedback = z.object({
  correctness: z.coerce.number().min(0).max(10),
  relevance: z.coerce.number().min(0).max(10),
  clarity: z.coerce.number().min(0).max(10),
  missing: z.array(z.string()),
  example: z.string(),
});

const evalSchema: z.ZodType<EvalOutput> = z.object({
  feedback,
  nextQuestion: z.string().nullable(),
});

export const interviews = Router();

interviews.get(
  "/",
  ah(async (req, res) => {
    const sessions = await InterviewSession.find({ user_id: req.user!.id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    res.json(sessions.map((s) => ({ ...s, id: s._id.toString() })));
  })
);

interviews.get(
  "/:id",
  ah(async (req, res) => {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user_id: req.user!.id,
    }).lean();

    if (!session) throw new AppError(404, "Session not found");

    res.json({
      session: { ...session, id: session._id.toString() },
      messages: session.messages ?? [],
    });
  })
);

interviews.post(
  "/",
  ah(async (req, res) => {
    const b = startSchema.parse(req.body);
    const uid = req.user!.id;

    const realisticQuestion = generateInterviewQuestion(b.role, b.type, b.difficulty);

    const { data: out, demo } = await askJson(
      uid,
      "interview_start",
      z.object({ question: z.string() }),
      SYS,
      `Start a ${b.difficulty} ${b.type} checkpoint interview for a ${b.role} candidate. Use only competencies and tasks that belong to this role and its industry. Do not ask behavioral or HR questions, and do not assume software experience for non-technical roles. Provide only the first role-specific question.\nCandidate skills: ${(b.candidate_skills ?? []).join(", ")}\nResume context: ${JSON.stringify(b.resume_context ?? {})}`,
      { question: realisticQuestion }
    );

    const now = new Date();
    const session = await InterviewSession.create({
      user_id: uid,
      role: b.role,
      type: b.type,
      difficulty: b.difficulty,
      question_count: b.question_count,
      status: "active",
      demo,
      messages: [
        {
          role: "assistant",
          content: out.question,
          created_at: now,
        },
      ],
      created_at: now,
    });

    res.status(201).json({
      session: { ...session.toObject(), id: session._id.toString() },
      question: out.question,
      demo,
    });
  })
);

interviews.post(
  "/:id/hint",
  ah(async (req, res) => {
    const uid = req.user!.id;
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user_id: uid,
    });

    if (!session) throw new AppError(404, "Session not found");

    const lastMsg = session.messages.filter((m) => m.role === "assistant").pop();
    const qText = lastMsg?.content || "Current interview topic";

    res.json({
      framework: "Role checkpoint method",
      keyPoints: [
        `Identify the ${session.role} responsibility being tested and define a strong result.`,
        "Explain the concrete steps, decisions, tools, or methods relevant to this role.",
        "Mention quality checks, constraints, risks, and evidence that the outcome worked.",
      ],
      hint: `Answer as a ${session.role}: focus on role-specific practice, decisions, and measurable evidence rather than general or behavioral statements.`,
    });
  })
);

interviews.post(
  "/:id/answer",
  ah(async (req, res) => {
    const { answer } = z
      .object({ answer: z.string().min(1).max(5000) })
      .parse(req.body);
    const uid = req.user!.id;

    const s = await InterviewSession.findOne({
      _id: req.params.id,
      user_id: uid,
    });

    if (!s) throw new AppError(404, "Session not found");
    if (s.status === "completed")
      throw new AppError(409, "Interview already completed");

    const list: Msg[] = s.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const isLast =
      list.filter((m) => m.role === "user").length + 1 >= s.question_count;

    const lastQuestion = list.filter((m) => m.role === "assistant").pop()?.content || "";
    const dynamicEval = evaluateInterviewAnswer(lastQuestion, answer, s.role, isLast);

    const { data: out, demo } = await askJson(
      uid,
      "interview_eval",
      evalSchema,
      SYS,
      `${list.map((m) => `${m.role}: ${m.content}`).join("\n")}\ncandidate: ${answer}\n` +
        (isLast
          ? "That was the final question. Set nextQuestion to null."
          : `Evaluate the answer against the ${s.role} role and ask the next ${s.type} checkpoint question. Do not ask behavioral or HR questions.`),
      dynamicEval
    );

    const next = isLast ? null : out.nextQuestion;
    const now = new Date();

    s.messages.push({
      role: "user",
      content: answer,
      feedback: out.feedback,
      created_at: now,
    });

    if (next) {
      s.messages.push({
        role: "assistant",
        content: next,
        created_at: new Date(now.getTime() + 100),
      });
    } else {
      s.status = "completed";
    }

    await s.save();

    res.json({
      feedback: out.feedback,
      nextQuestion: next,
      completed: !next,
      demo,
    });
  })
);
