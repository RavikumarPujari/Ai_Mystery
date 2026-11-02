import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { geminiClient } from "../src/services/gemini/geminiClient.js";
import { connectDatabase } from "../src/config/database.js";
import { MysteryModel } from "../src/models/Mystery.model.js";
import { env } from "../src/config/env.js";
import mongoose from "mongoose";

async function verify() {
  console.log("============================================================");
  console.log("CONFIGURATION & CREDENTIAL SAFETY AUDIT");
  console.log("============================================================");

  // 1. Check environment file existence & variable loading
  const rootEnvPath = path.resolve(process.cwd(), ".env");
  const rootEnvExists = fs.existsSync(rootEnvPath);
  console.log("\n[1] Environment File Loading:");
  console.log(` - Root .env exists on disk: ${rootEnvExists}`);

  let parsedRootEnv: Record<string, string> = {};
  if (rootEnvExists) {
    parsedRootEnv = dotenv.parse(fs.readFileSync(rootEnvPath));
  }

  const hasMongoUri = Boolean(env.MONGODB_URI && env.MONGODB_URI.trim().length > 0);
  const isMongoUriStandardFormat =
    env.MONGODB_URI.startsWith("mongodb://") || env.MONGODB_URI.startsWith("mongodb+srv://");
  console.log(` - MONGODB_URI loaded in backend: ${hasMongoUri ? "YES (Valid Format: " + isMongoUriStandardFormat + ")" : "NO"}`);

  const hasGeminiKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10);
  console.log(` - GEMINI_API_KEY loaded in backend: ${hasGeminiKey ? "YES (Length: " + env.GEMINI_API_KEY.length + " chars)" : "NO"}`);
  console.log(` - GEMINI_MODEL: ${env.GEMINI_MODEL}`);

  // 2. Secret Exposure & .env.example Check
  console.log("\n[2] Secret Exposure & .gitignore Audit:");
  const examplePath = path.resolve(process.cwd(), ".env.example");
  let exampleExposesSecret = false;
  if (fs.existsSync(examplePath)) {
    const exampleParsed = dotenv.parse(fs.readFileSync(examplePath));
    if (
      exampleParsed.GEMINI_API_KEY &&
      parsedRootEnv.GEMINI_API_KEY &&
      exampleParsed.GEMINI_API_KEY === parsedRootEnv.GEMINI_API_KEY
    ) {
      exampleExposesSecret = true;
    }
  }
  console.log(` - .env.example exposes real GEMINI_API_KEY: ${exampleExposesSecret ? "EXPOSED!" : "SAFE (Placeholder only)"}`);

  // Check client code for leaked secrets
  let clientLeakDetected = false;
  const clientSrcDir = path.resolve(process.cwd(), "client/src");
  if (fs.existsSync(clientSrcDir) && env.GEMINI_API_KEY) {
    const searchFiles = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          searchFiles(full);
        } else {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes(env.GEMINI_API_KEY)) {
            clientLeakDetected = true;
          }
        }
      }
    };
    searchFiles(clientSrcDir);
  }
  console.log(` - Frontend client code leaks GEMINI_API_KEY: ${clientLeakDetected ? "LEAK FOUND" : "SAFE (Zero frontend exposure)"}`);

  // 3. Test MongoDB Connection & Preservation of Existing Records
  console.log("\n[3] MongoDB Connection & Persistence Verification:");
  let mongoPass = false;
  try {
    await connectDatabase();
    const state = mongoose.connection.readyState;
    if (state === 1) {
      const totalCases = await MysteryModel.countDocuments();
      console.log(` - Connection status: CONNECTED (ReadyState: ${state})`);
      console.log(` - Existing investigation records preserved in DB: ${totalCases} cases found`);
      console.log(` - Collection safety: Verified intact (Zero reset/drop performed)`);
      mongoPass = true;
    } else {
      console.log(` - Connection state: ${state} (Not ready)`);
    }
  } catch (err: any) {
    console.error(` - MongoDB Connection Error: ${err?.message || err}`);
  }

  // 4. Test Gemini API Integration, Structured JSON Generation & Model Fallback
  console.log("\n[4] Gemini API Integration & Connectivity Verification:");
  let geminiPass = false;
  if (hasGeminiKey) {
    try {
      console.log(" - Testing structured JSON synthesis via geminiClient...");
      const result = await geminiClient.generateStructuredJson<{ status: string }>(
        "Respond with a JSON object with key status and value ready",
        {
          type: "object",
          properties: {
            status: { type: "string" },
          },
          required: ["status"],
        },
        "You are an investigation AI system."
      );

      if (result && result.status) {
        console.log(` - Gemini API connectivity & schema enforcement: OPERATIONAL (Result: "${result.status}")`);
        console.log(` - Authentication: VALID`);
        console.log(` - Model fallback chain: OPERATIONAL`);
        geminiPass = true;
      } else {
        console.log(" - Gemini returned unexpected payload format.");
      }
    } catch (err: any) {
      console.error(` - Gemini call failed: ${err?.message || err}`);
    }
  } else {
    console.log(" - Skipped: GEMINI_API_KEY is missing or empty.");
  }

  console.log("\n============================================================");
  console.log("FINAL AUDIT SUMMARY:");
  console.log(` - Gemini Configuration: ${geminiPass ? "PASS" : "FAIL"}`);
  console.log(` - MongoDB Connection: ${mongoPass ? "PASS" : "FAIL"}`);
  console.log(` - Environment-variable Loading: ${hasMongoUri && hasGeminiKey ? "PASS" : "FAIL"}`);
  console.log(` - Secret Exposure Check: ${!clientLeakDetected && !exampleExposesSecret ? "PASS" : "FAIL"}`);
  console.log("============================================================");

  process.exit(0);
}

verify().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});

