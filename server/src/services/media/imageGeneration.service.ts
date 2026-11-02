import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { MediaAssetModel } from "../../models/MediaAsset.model.js";

export interface SvgDesignOptions {
  title?: string;
  subtitle?: string;
  role?: string;
  location?: string;
  timestamp?: string;
  clothingColor?: string;
  hairColor?: string;
  accentColor?: string;
  iconType?: "portrait" | "cctv" | "evidence";
  tag?: string;
}

export interface GenerateImageParams {
  caseId: string;
  evidenceId: string;
  prompt: string;
  type: "suspect" | "cctv" | "image";
  svgOptions: SvgDesignOptions;
}

export interface GeneratedImageResult {
  assetId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  tierUsed: "huggingface" | "pollinations" | "svg_fallback";
}

export class ImageGenerationService {
  private baseDir: string;
  private pollinationsDisabledUntil: number = 0;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.MEDIA_STORAGE_PATH || "./uploads");
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        console.warn("Could not create media uploads directory:", err);
      }
    }
  }

  /**
   * Main entrypoint for generating scenario-based images using 3-tier zero-cost architecture.
   */
  async generateImage(params: GenerateImageParams): Promise<GeneratedImageResult> {
    let buffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    let tierUsed: "huggingface" | "pollinations" | "svg_fallback" = "svg_fallback";

    // -------------------------------------------------------------------------
    // Tier 1: Hugging Face FLUX.1-schnell (Serverless Inference)
    // -------------------------------------------------------------------------
    if (env.HF_TOKEN && env.HF_TOKEN.trim().length > 0) {
      try {
        const hfResult = await this.generateWithHuggingFace(params.prompt);
        if (hfResult) {
          buffer = hfResult.buffer;
          mimeType = hfResult.mimeType;
          tierUsed = "huggingface";
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[ImageGen] Tier 1 (Hugging Face) failed (${msg}). Falling back to Tier 2.`);
      }
    }

    // -------------------------------------------------------------------------
    // Tier 2: Pollinations FLUX / SANA (Zero-Config Open Access with Circuit Breaker)
    // -------------------------------------------------------------------------
    if (!buffer && Date.now() > this.pollinationsDisabledUntil) {
      try {
        const pollResult = await this.generateWithPollinations(params.prompt);
        if (pollResult) {
          buffer = pollResult.buffer;
          mimeType = pollResult.mimeType;
          tierUsed = "pollinations";
        }
      } catch (err: unknown) {
        // Trip circuit breaker for 3 minutes on failure to prevent multi-second request stalls
        this.pollinationsDisabledUntil = Date.now() + 3 * 60 * 1000;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[ImageGen] Tier 2 (Pollinations) failed (${msg}). Circuit breaker tripped for 3m. Using Tier 3 SVG.`);
      }
    }

    // -------------------------------------------------------------------------
    // Tier 3: Scenario-Specific Dynamic SVG Fallback (100% Offline / Free)
    // -------------------------------------------------------------------------
    if (!buffer) {
      const svg = this.generateScenarioSvg(params.type, params.svgOptions);
      buffer = Buffer.from(svg, "utf-8");
      mimeType = "image/svg+xml";
      tierUsed = "svg_fallback";
    }

    // -------------------------------------------------------------------------
    // Persistent Storage Execution
    // -------------------------------------------------------------------------
    const ext = mimeType === "image/svg+xml" ? ".svg" : ".jpg";
    const assetId = `asset_${uuidv4().replace(/-/g, "").substring(0, 16)}`;
    const storageKey = `${assetId}${ext}`;
    const targetPath = path.join(this.baseDir, storageKey);

    // 1. Write file to local disk (for dev and active container fast serving)
    try {
      await fs.promises.writeFile(targetPath, buffer);
    } catch (err) {
      console.warn("[ImageGen] Warning: Could not write file to disk:", err);
    }

    // 2. Persist in MongoDB Atlas (guarantees persistence across Render Free ephemeral restarts)
    const dataBase64 = buffer.toString("base64");
    const relativeUrl = `/uploads/${storageKey}`;

    try {
      let caseObjectId: mongoose.Types.ObjectId;
      try {
        caseObjectId = new mongoose.Types.ObjectId(params.caseId);
      } catch {
        caseObjectId = new mongoose.Types.ObjectId();
      }

      await MediaAssetModel.create({
        caseId: caseObjectId,
        evidenceId: params.evidenceId,
        type: "image",
        status: "ready",
        storageKey,
        url: relativeUrl,
        mimeType,
        sizeBytes: buffer.length,
        promptUsed: params.prompt,
        dataBase64,
        tierUsed,
      });
    } catch (dbErr) {
      console.warn("[ImageGen] Failed to record media asset in MongoDB:", dbErr);
    }

    return {
      assetId,
      storageKey,
      url: relativeUrl,
      mimeType,
      sizeBytes: buffer.length,
      tierUsed,
    };
  }

  /**
   * Helper to validate that a downloaded buffer contains real image magic bytes (not HTML error pages)
   */
  private isValidImageBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 10) return false;
    // Check JPEG magic bytes: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // Check PNG magic bytes: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    // Check WebP magic bytes: RIFF .... WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    )
      return true;
    return false;
  }

  /**
   * Hugging Face Inference API call for FLUX.1-schnell
   */
  private async generateWithHuggingFace(
    prompt: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const endpoint = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 4,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Hugging Face responded with status ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (!this.isValidImageBuffer(buffer)) {
        throw new Error("Invalid buffer received from Hugging Face.");
      }

      return { buffer, mimeType: contentType.includes("png") ? "image/png" : "image/jpeg" };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Pollinations fast open endpoint call with bounded 4.5s timeout
   */
  private async generateWithPollinations(
    prompt: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const seed = Math.floor(Math.random() * 100000);
    const encoded = encodeURIComponent(prompt.substring(0, 300));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=turbo&nologo=true&seed=${seed}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (this.isValidImageBuffer(buffer)) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        return { buffer, mimeType: contentType.includes("png") ? "image/png" : "image/jpeg" };
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Pollinations failed: ${msg}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Tier 3: High-fidelity scenario-specific dynamic SVG generator
   */
  public generateScenarioSvg(
    type: "suspect" | "cctv" | "image",
    options: SvgDesignOptions
  ): string {
    const clothingColor = options.clothingColor || "#38bdf8";
    const hairColor = options.hairColor || "#e2e8f0";
    const title = this.escapeXml(options.title || "CASE EVIDENCE");
    const subtitle = this.escapeXml(options.subtitle || "OFFICIAL INVESTIGATION RECORD");
    const role = this.escapeXml(options.role || "PERSON OF INTEREST");
    const location = this.escapeXml(options.location || "SCENE OF INCIDENT");
    const timestamp = this.escapeXml(options.timestamp || "22:15:00 UTC");

    if (type === "suspect") {
      return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#0B0F19"/>
  <rect x="16" y="16" width="480" height="480" rx="16" fill="#111827" stroke="#1E293B" stroke-width="2"/>
  
  <!-- Subtle Grid Backdrop -->
  <line x1="16" y1="256" x2="496" y2="256" stroke="#1E293B" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="256" y1="16" x2="256" y2="496" stroke="#1E293B" stroke-width="1" stroke-dasharray="4 4"/>
  
  <!-- Height Grid Markers (Mugshot Aesthetic) -->
  <line x1="80" y1="140" x2="432" y2="140" stroke="#1E293B" stroke-width="1"/>
  <line x1="80" y1="180" x2="432" y2="180" stroke="#1E293B" stroke-width="1"/>
  <line x1="80" y1="220" x2="432" y2="220" stroke="#1E293B" stroke-width="1"/>
  <line x1="80" y1="260" x2="432" y2="260" stroke="#1E293B" stroke-width="1"/>
  
  <!-- Suspect Silhouette -->
  <!-- Torso & Shoulders -->
  <path d="M140 430 C140 330, 190 310, 256 310 C322 310, 372 330, 372 430 Z" fill="${clothingColor}" opacity="0.85"/>
  <!-- Collar / Neckline -->
  <path d="M226 310 L256 350 L286 310 Z" fill="#0B0F19"/>
  <!-- Neck -->
  <rect x="238" y="270" width="36" height="44" fill="#cbd5e1"/>
  <!-- Head -->
  <ellipse cx="256" cy="205" rx="55" ry="68" fill="#e2e8f0"/>
  <!-- Hair Styling -->
  <path d="M198 190 C198 120, 314 120, 314 190 C300 150, 212 150, 198 190 Z" fill="${hairColor}"/>
  
  <!-- Top Dossier Stamp -->
  <rect x="40" y="36" width="130" height="24" rx="4" fill="#1E293B" stroke="#8B5CF6" stroke-width="1"/>
  <text x="105" y="52" fill="#A78BFA" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">SUSPECT DOSSIER</text>
  
  <!-- Name & Role Card Plaque -->
  <rect x="56" y="420" width="400" height="56" rx="8" fill="#0B0F19" stroke="#8B5CF6" stroke-width="1.5"/>
  <text x="256" y="445" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${title}</text>
  <text x="256" y="463" fill="#A78BFA" font-family="monospace" font-size="12" text-anchor="middle">${role}</text>
</svg>`.trim();
    }

    if (type === "cctv") {
      return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#05070B"/>
  
  <!-- CRT Screen Bezel -->
  <rect x="16" y="16" width="480" height="480" rx="12" fill="#0A0E17" stroke="#1E293B" stroke-width="3"/>
  
  <!-- Scanlines Effect -->
  <line x1="20" y1="120" x2="492" y2="120" stroke="#162032" stroke-width="1"/>
  <line x1="20" y1="200" x2="492" y2="200" stroke="#162032" stroke-width="1"/>
  <line x1="20" y1="280" x2="492" y2="280" stroke="#162032" stroke-width="1"/>
  <line x1="20" y1="360" x2="492" y2="360" stroke="#162032" stroke-width="1"/>
  
  <!-- High-Angle Surveillance Perspective Wireframe -->
  <polygon points="120,100 392,100 460,400 52,400" fill="#0E1626" stroke="#253550" stroke-width="1.5"/>
  <line x1="256" y1="100" x2="256" y2="400" stroke="#253550" stroke-width="1" stroke-dasharray="6 4"/>
  
  <!-- Camera Reticle / Motion Tracking Box -->
  <rect x="200" y="190" width="112" height="150" fill="none" stroke="#10B981" stroke-width="1.5" stroke-dasharray="4 2"/>
  <!-- Target Entity Silhouette -->
  <ellipse cx="256" cy="230" rx="20" ry="24" fill="#34D399"/>
  <path d="M228 320 C228 270, 284 270, 284 320 Z" fill="#059669"/>
  <text x="256" y="180" fill="#10B981" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">[ TARGET IDENTIFIED ]</text>
  
  <!-- Top Status Banner -->
  <circle cx="48" cy="48" r="6" fill="#EF4444"/>
  <text x="64" y="52" fill="#EF4444" font-family="monospace" font-size="12" font-weight="bold">REC • LIVE SURVEILLANCE FEED</text>
  <text x="464" y="52" fill="#A78BFA" font-family="monospace" font-size="12" text-anchor="end">${timestamp}</text>
  
  <!-- Bottom Camera Info Overlay -->
  <rect x="36" y="420" width="440" height="44" rx="6" fill="#0B0F19" stroke="#1E293B" stroke-width="1"/>
  <text x="52" y="446" fill="#FFFFFF" font-family="monospace" font-size="12" font-weight="bold">${title}</text>
  <text x="460" y="446" fill="#94A3B8" font-family="monospace" font-size="11" text-anchor="end">${location}</text>
</svg>`.trim();
    }

    // Default: Crime Scene / Physical Evidence Photograph
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#0B0F19"/>
  <rect x="20" y="20" width="472" height="472" rx="16" fill="#111827" stroke="#1E293B" stroke-width="2"/>
  
  <!-- Forensic Camera Viewfinder Frame -->
  <path d="M50 80 L50 50 L80 50" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M462 80 L462 50 L432 50" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M50 432 L50 462 L80 462" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M462 432 L462 462 L432 462" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  
  <!-- Focus Crosshairs -->
  <line x1="256" y1="216" x2="256" y2="296" stroke="#8B5CF6" stroke-width="1"/>
  <line x1="216" y1="256" x2="296" y2="256" stroke="#8B5CF6" stroke-width="1"/>
  <circle cx="256" cy="256" r="36" stroke="#8B5CF6" stroke-width="1" stroke-dasharray="4 4" fill="none"/>
  
  <!-- Evidence Object Representation -->
  <rect x="180" y="220" width="152" height="96" rx="8" fill="#1E293B" stroke="#A78BFA" stroke-width="2"/>
  <!-- Police Evidence Placard Marker -->
  <polygon points="150,330 180,280 200,330" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
  <text x="175" y="322" fill="#000000" font-family="monospace" font-size="14" font-weight="bold">#1</text>
  
  <!-- Header Forensic Badge -->
  <rect x="48" y="60" width="180" height="26" rx="6" fill="#1E293B" stroke="#8B5CF6" stroke-width="1"/>
  <text x="138" y="77" fill="#C084FC" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">FORENSIC ARTIFACT</text>
  
  <!-- Details Box -->
  <rect x="48" y="380" width="416" height="60" rx="8" fill="#0B0F19" stroke="#1E293B" stroke-width="1.5"/>
  <text x="68" y="406" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">${title}</text>
  <text x="68" y="426" fill="#94A3B8" font-family="monospace" font-size="11">${subtitle} • ${location}</text>
</svg>`.trim();
  }

  /**
   * Helper to resolve an image buffer from disk or MongoDB fallback (crucial for Render Free).
   */
  async getMediaBuffer(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const targetPath = path.join(this.baseDir, storageKey);

    // 1. If present on disk, read directly
    if (fs.existsSync(targetPath)) {
      try {
        const buffer = await fs.promises.readFile(targetPath);
        const ext = path.extname(storageKey).toLowerCase();
        const mimeType = ext === ".svg" ? "image/svg+xml" : ext === ".png" ? "image/png" : "image/jpeg";
        return { buffer, mimeType };
      } catch (err) {
        console.warn(`[ImageGen] Error reading ${storageKey} from disk:`, err);
      }
    }

    // 2. Fallback to MongoDB (handles container spin-down / redeploy on Render Free)
    try {
      const asset = await MediaAssetModel.findOne({ storageKey }).select("+dataBase64");
      if (asset && asset.dataBase64) {
        const buffer = Buffer.from(asset.dataBase64, "base64");
        // Re-cache locally for future fast hits
        try {
          if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
          }
          await fs.promises.writeFile(targetPath, buffer);
        } catch {
          // ignore disk caching error on read-only environments
        }
        return { buffer, mimeType: asset.mimeType || "image/jpeg" };
      }
    } catch (err) {
      console.warn(`[ImageGen] Error fetching ${storageKey} from MongoDB:`, err);
    }

    return null;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
}

export const imageGenerationService = new ImageGenerationService();
