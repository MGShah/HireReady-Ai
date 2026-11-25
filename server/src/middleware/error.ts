import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ah = (fn: RequestHandler): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return void res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err?.name === "CastError") {
    return void res.status(400).json({ error: `Invalid ${err.path || "identifier"} format` });
  }

  // Handle MongoDB Duplicate Key (E11000)
  if ((err as any)?.code === 11000) {
    const duplicateFields = Object.keys((err as any)?.keyValue || {}).join(", ");
    return void res.status(409).json({
      error: `A record with this ${duplicateFields || "value"} already exists`,
    });
  }

  if (err instanceof AppError || (err && typeof (err as any).status === "number")) {
    const status = (err as any).status || 500;
    return void res.status(status).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

