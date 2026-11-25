import mongoose from "mongoose";
import "dotenv/config";
import { env } from "../env";

async function ensureValidators() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for schema verification...");

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connected");

  // Update profiles validator to include phone, linkedin, website, summary
  try {
    await db.command({
      collMod: "profiles",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "user_id",
            "role",
            "skills",
            "daily_minutes",
            "created_at",
            "updated_at",
          ],
          properties: {
            user_id: { bsonType: "string" },
            role: { enum: ["user", "admin"] },
            full_name: { bsonType: ["string", "null"] },
            education: { bsonType: ["string", "null"] },
            college: { bsonType: ["string", "null"] },
            graduation_year: { bsonType: ["int", "long", "null"] },
            skills: {
              bsonType: "array",
              items: { bsonType: "string" },
              maxItems: 80,
            },
            target_role: { bsonType: ["string", "null"] },
            location: { bsonType: ["string", "null"] },
            phone: { bsonType: ["string", "null"] },
            linkedin: { bsonType: ["string", "null"] },
            website: { bsonType: ["string", "null"] },
            summary: { bsonType: ["string", "null"] },
            daily_minutes: {
              bsonType: ["int", "long"],
              minimum: 15,
              maximum: 480,
            },
            created_at: { bsonType: "date" },
            updated_at: { bsonType: "date" },
          },
        },
      },
      validationLevel: "moderate",
    });
    console.log("Updated 'profiles' validator with frontend contact/summary fields successfully!");
  } catch (err) {
    console.warn("Notice updating profiles validator:", (err as Error).message);
  }

  // Update applications validator to allow optional fields like salary, deadline, location
  try {
    await db.command({
      collMod: "applications",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "user_id",
            "company",
            "title",
            "status",
            "created_at",
            "updated_at",
          ],
          properties: {
            user_id: { bsonType: "string" },
            company: { bsonType: "string" },
            title: { bsonType: "string" },
            url: { bsonType: ["string", "null"] },
            status: {
              enum: [
                "saved",
                "applied",
                "assessment",
                "interview",
                "offer",
                "rejected",
                "withdrawn",
              ],
            },
            notes: { bsonType: ["string", "null"] },
            created_at: { bsonType: "date" },
            updated_at: { bsonType: "date" },
          },
        },
      },
      validationLevel: "moderate",
    });
    console.log("Updated 'applications' validator successfully!");
  } catch (err) {
    console.warn("Notice updating applications validator:", (err as Error).message);
  }

  // Update aiUsageLogs validator to allow all AI providers (huggingface, openai, etc.)
  try {
    await db.command({
      collMod: "aiUsageLogs",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["user_id", "feature", "provider", "model", "created_at"],
          properties: {
            user_id: { bsonType: "string" },
            feature: { bsonType: "string" },
            provider: { bsonType: "string" },
            model: { bsonType: "string" },
            created_at: { bsonType: "date" },
            request_tokens: { bsonType: ["int", "long", "null"] },
            response_tokens: { bsonType: ["int", "long", "null"] },
            latency_ms: { bsonType: ["int", "long", "null"] },
            success: { bsonType: ["bool", "null"] },
            error_message: { bsonType: ["string", "null"] },
          },
        },
      },
      validationLevel: "moderate",
    });
    console.log("Updated 'aiUsageLogs' validator successfully!");
  } catch (err) {
    console.warn("Notice updating aiUsageLogs validator:", (err as Error).message);
  }


  // Also check if any additional collections are required:
  // Let's create an optional 'careerGoals' or 'interviewTemplates' collection if needed
  const collections = await db.listCollections().toArray();
  console.log(
    "Existing collections:",
    collections.map((c) => c.name)
  );

  await mongoose.disconnect();
  console.log("Database schema check finished!");
}

ensureValidators().catch(console.error);
