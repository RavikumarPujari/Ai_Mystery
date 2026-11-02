import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host || "in-memory"}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

