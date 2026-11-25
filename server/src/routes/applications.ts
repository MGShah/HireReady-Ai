import { Router } from "express";
import { z } from "zod";
import { AppError, ah } from "../middleware/error";
import { Application } from "../models/Application";

const status = z.enum([
  "saved",
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

const create = z.object({
  company: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  url: z
    .string()
    .max(1000)
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return null;
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .nullable()
    .optional(),
  status: status.default("saved"),
  notes: z.string().max(4000).optional(),
});


export const applications = Router();

applications.get(
  "/",
  ah(async (req, res) => {
    const page = z.coerce.number().int().min(1).default(1).parse(req.query.page);
    const apps = await Application.find({ user_id: req.user!.id })
      .sort({ updated_at: -1 })
      .skip((page - 1) * 50)
      .limit(50)
      .lean();

    res.json(apps.map((a) => ({ ...a, id: a._id.toString() })));
  })
);

applications.post(
  "/",
  ah(async (req, res) => {
    const parsed = create.parse(req.body);
    const now = new Date();
    const app = await Application.create({
      ...parsed,
      url: parsed.url || null,
      notes: parsed.notes || null,
      user_id: req.user!.id,
      created_at: now,
      updated_at: now,
    });

    res.status(201).json({ ...app.toObject(), id: app._id.toString() });
  })
);

applications.patch(
  "/:id",
  ah(async (req, res) => {
    const body = create.partial().parse(req.body);
    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user!.id },
      { ...body, updated_at: new Date() },
      { returnDocument: "after" }
    ).lean();

    if (!updated) throw new AppError(404, "Application not found");
    res.json({ ...updated, id: updated._id.toString() });
  })
);

applications.delete(
  "/:id",
  ah(async (req, res) => {
    await Application.deleteOne({ _id: req.params.id, user_id: req.user!.id });
    res.status(204).end();
  })
);
