import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { User } from "../models/User";
import { AppError, ah } from "./error";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "user" | "admin";
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export const requireAuth: RequestHandler = ah(async (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError(401, "Missing token");

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    throw new AppError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.userId).lean();
  if (!user || !user.isActive) {
    throw new AppError(401, "User not found or account deactivated");
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  next();
});

export const requireRole = (role: "user" | "admin"): RequestHandler =>
  ah(async (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      throw new AppError(403, "Forbidden");
    }
    next();
  });
