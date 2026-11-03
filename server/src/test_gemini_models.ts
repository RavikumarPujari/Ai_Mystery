import { GoogleGenAI } from "@google/genai";
import { env } from "./config/env.js";

async function runBenchmark() {
  const apiKey = env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY present:", !!apiKey);

  if (!apiKey) {
    console.error("No GEMINI_API_KEY");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const testModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      culprit: { type: "string" },
      clue: { type: "string" }
    },
    required: ["title", "culprit", "clue"]
  };

  console.log("Beginning model benchmark against Google GenAI API...");

  for (const model of testModels) {
    const start = Date.now();
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Create a 1-sentence mystery clue about a stolen sapphire brooch.",
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7
        }
      });
      const dur = Date.now() - start;
      const text = res.text || "{}";
      const parsed = JSON.parse(text);
      console.log(`[PASS] ${model} (${dur}ms) -> Title: "${parsed.title}"`);
    } catch (err: unknown) {
      const dur = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[FAIL] ${model} (${dur}ms) -> Error: ${msg.substring(0, 150)}`);
    }
  }
}

runBenchmark().catch(console.error);

