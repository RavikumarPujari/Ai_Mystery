import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/errorHandler.js";

export class GeminiClient {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      } catch (err) {
        console.warn("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }

  public isAvailable(): boolean {
    return this.aiClient !== null;
  }

  /**
   * Generates structured JSON from Gemini using modern JSON schema enforcement.
   */
  async generateStructuredJson<T>(
    userPrompt: string,
    schema: Record<string, unknown>,
    systemInstruction?: string,
    modelOverride?: string
  ): Promise<T> {
    if (!this.aiClient) {
      throw new AppError(
        "Gemini API key is not configured.",
        503,
        "AI_PROVIDER_UNAVAILABLE"
      );
    }

    const preferredModel = modelOverride || env.GEMINI_MODEL || "gemini-3.5-flash";
    const modelsToTry = Array.from(
      new Set([preferredModel, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])
    );

    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.aiClient.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7,
          },
        });

        const text = response.text;
        if (!text) {
          throw new AppError("Gemini returned an empty response.", 502, "GENERATION_FAILED");
        }

        return JSON.parse(text) as T;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("404") ||
          msg.includes("NOT_FOUND")
        ) {
          console.warn(
            `Gemini model '${model}' failed with transient error (${msg.substring(0, 120)}). Trying fallback model...`
          );
          continue;
        }
        break;
      }
    }

    if (lastError instanceof AppError) throw lastError;

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    console.error("Gemini API Error:", errorMessage);

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new AppError("Gemini rate limit exceeded. Please try again later.", 429, "RATE_LIMITED");
    }
    if (errorMessage.includes("SAFETY") || errorMessage.includes("BLOCKED")) {
      throw new AppError("Scenario was flagged by safety guidelines.", 400, "VALIDATION_ERROR");
    }

    throw new AppError(
      `Failed to generate structured AI response: ${errorMessage}`,
      502,
      "GENERATION_FAILED"
    );
  }
}

export const geminiClient = new GeminiClient();

