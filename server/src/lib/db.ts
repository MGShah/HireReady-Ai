import mongoose from "mongoose";
import { env } from "../env";

const LOCAL_FALLBACK_URI = "mongodb://127.0.0.1:27017/careerpilot";

export async function connectDB(): Promise<typeof mongoose> {
  let targetUri = env.MONGODB_URI;

  // Check if URI contains placeholders
  if (targetUri.includes("YOUR_USERNAME") || targetUri.includes("YOUR_PASSWORD")) {
    console.warn(
      "⚠️ MONGODB_URI contains placeholder credentials (YOUR_USERNAME/YOUR_PASSWORD). Falling back to local MongoDB:",
      LOCAL_FALLBACK_URI
    );
    targetUri = LOCAL_FALLBACK_URI;
  }

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Safely drop conflicting legacy userId_1 indexes if present
    const db = conn.connection.db;
    if (db) {
      await db.collection("profiles").dropIndex("userId_1").catch(() => {});
      await db.collection("resumes").dropIndex("userId_1").catch(() => {});
    }

    return conn;
  } catch (primaryError) {
    if (targetUri !== LOCAL_FALLBACK_URI) {
      console.warn("Primary MongoDB connection failed. Attempting fallback to local MongoDB at", LOCAL_FALLBACK_URI);
      try {
        const fallbackConn = await mongoose.connect(LOCAL_FALLBACK_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected via local fallback: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        const db = fallbackConn.connection.db;
        if (db) {
          await db.collection("profiles").dropIndex("userId_1").catch(() => {});
          await db.collection("resumes").dropIndex("userId_1").catch(() => {});
        }
        return fallbackConn;
      } catch (fallbackError) {
        console.error("Local MongoDB fallback also failed:", fallbackError);
        throw primaryError;
      }
    }
    console.error("MongoDB connection error:", primaryError);
    throw primaryError;
  }
}

