import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Profile, Resume } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seedAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for admin seeding...");

  // 1. Promote mahekgshah@gmail.com if present
  const userToPromote = await User.findOne({ email: "mahekgshah@gmail.com" });
  if (userToPromote) {
    userToPromote.role = "admin";
    await userToPromote.save();
    console.log(`[OK] Promoted mahekgshah@gmail.com to admin.`);
  }

  // 2. Ensure a master admin exists: admin@careerpilot.com / Admin@CareerPilot2026!
  const adminEmail = "admin@careerpilot.com";
  let masterAdmin = await User.findOne({ email: adminEmail });
  if (!masterAdmin) {
    const passwordHash = await bcrypt.hash("Admin@CareerPilot2026!", 10);
    const now = new Date();
    masterAdmin = await User.create({
      email: adminEmail,
      passwordHash,
      role: "admin",
      isActive: true,
      emailVerified: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const adminId = masterAdmin._id.toString();
    await Profile.create({
      user_id: adminId,
      role: "admin",
      full_name: "System Administrator",
      target_role: "Lead Platform Administrator",
      skills: ["System Architecture", "Security", "AI Telemetry", "User Operations"],
      created_at: now,
      updated_at: now,
    });

    await Resume.create({
      user_id: adminId,
      content: {
        template: "modern",
        name: "System Administrator",
        headline: "Lead Platform Administrator",
        email: adminEmail,
        phone: "+1 (555) 019-2831",
        location: "Global",
        summary: "Platform Administrator overseeing Nexa intelligence systems and candidate career workflows.",
        skills: "System Architecture, Security, AI Telemetry, Operations",
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      },
      created_at: now,
      updated_at: now,
    });

    console.log(`[OK] Created master admin account: ${adminEmail} (password: Admin@CareerPilot2026!)`);
  } else {
    if (masterAdmin.role !== "admin") {
      masterAdmin.role = "admin";
      await masterAdmin.save();
      console.log(`[OK] Updated ${adminEmail} to admin role.`);
    } else {
      console.log(`[OK] Master admin ${adminEmail} already exists with admin role.`);
    }
  }

  const adminCount = await User.countDocuments({ role: "admin" });
  console.log(`Total admin users in database: ${adminCount}`);

  await mongoose.disconnect();
  console.log("Seeding completed successfully.");
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
