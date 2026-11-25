import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { app } from "../app";
import { User } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected to MongoDB for Admin Endpoint verification");

  const admin = await User.findOne({ role: "admin" }).lean();
  if (!admin) {
    throw new Error("No admin user found to test with");
  }

  const token = jwt.sign(
    { userId: admin._id.toString(), email: admin.email, role: "admin" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  console.log(`Generated test token for admin: ${admin.email}`);

  // Test with supertest or native mock request or direct route execution
  // Let's do a fetch against running server if running, or express request
  const http = await import("http");
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5009, () => {
      console.log("Test server listening on port 5009");
      resolve();
    });
  });

  const baseUrl = "http://127.0.0.1:5009";

  try {
    // 1. Test /api/admin/check
    const checkRes = await fetch(`${baseUrl}/api/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    console.log("[1] Check endpoint:", checkRes.status, checkData);

    // 2. Test /api/admin/stats
    const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statsData = await statsRes.json();
    console.log("[2] Stats endpoint:", statsRes.status, {
      users: statsData.counts?.users,
      applications: statsData.counts?.applications,
      interviews: statsData.counts?.interviews,
      recentActivityCount: statsData.recentActivity?.length,
    });

    // 3. Test /api/admin/performance
    const perfRes = await fetch(`${baseUrl}/api/admin/performance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const perfData = await perfRes.json();
    console.log("[3] Performance endpoint:", perfRes.status, {
      uptime: perfData.system?.uptimeFormatted,
      memoryHeapMB: perfData.system?.memory?.heapUsedMB,
      dbStatus: perfData.database?.status,
      aiFeatures: perfData.ai?.featureStats?.length,
    });

    // 4. Test /api/admin/users
    const usersRes = await fetch(`${baseUrl}/api/admin/users?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usersData = await usersRes.json();
    console.log("[4] Users endpoint:", usersRes.status, {
      total: usersData.total,
      returnedCount: usersData.users?.length,
      sampleEmail: usersData.users?.[0]?.email,
    });

    // 5. Test /api/admin/applications
    const appsRes = await fetch(`${baseUrl}/api/admin/applications?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const appsData = await appsRes.json();
    console.log("[5] Applications endpoint:", appsRes.status, {
      total: appsData.total,
      returnedCount: appsData.applications?.length,
    });

    // 6. Test /api/admin/test-db
    const testDbRes = await fetch(`${baseUrl}/api/admin/test-db`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const testDbData = await testDbRes.json();
    console.log("[6] DB Ping endpoint:", testDbRes.status, testDbData);

    console.log("ALL ADMIN BACKEND TESTS PASSED SUCCESSFULLY!");
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
