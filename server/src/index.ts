import "dotenv/config";
import { app } from "./app";
import { env } from "./env";
import { connectDB } from "./lib/db";

async function bootstrap() {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`API on :${env.PORT}`);
      console.log("MongoDB connection established");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB and start server:", error);
    process.exit(1);
  }
}

bootstrap();
