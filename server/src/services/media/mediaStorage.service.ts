import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env.js";

export interface StoredMediaResult {
  assetId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export class MediaStorageService {
  private baseDir: string;

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
   * Saves a buffer to local media storage
   */
  async saveMedia(
    buffer: Buffer,
    filename: string,
    mimeType = "image/jpeg"
  ): Promise<StoredMediaResult> {
    const ext = path.extname(filename) || (mimeType === "image/png" ? ".png" : ".jpg");
    const assetId = `asset_${uuidv4()}`;
    const storageKey = `${assetId}${ext}`;
    const targetPath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      assetId,
      storageKey,
      url: `/uploads/${storageKey}`,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Generates a thematic SVG placeholder thumbnail for offline/mock investigations
   */
  async generateThematicFallbackImage(
    label: string,
    subtext = "SIMULATED SURVEILLANCE STILL"
  ): Promise<StoredMediaResult> {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="#0d0f12">
        <rect width="640" height="360" fill="#14181f" stroke="#2e3848" stroke-width="4"/>
        <line x1="0" y1="180" x2="640" y2="180" stroke="#2e3848" stroke-width="1" stroke-dasharray="4"/>
        <line x1="320" y1="0" x2="320" y2="360" stroke="#2e3848" stroke-width="1" stroke-dasharray="4"/>
        <circle cx="320" cy="180" r="48" fill="#1b212b" stroke="#f59e0b" stroke-width="2"/>
        <text x="320" y="175" fill="#f59e0b" font-family="monospace" font-size="14" text-anchor="middle" font-weight="bold">[ OPTICAL CAPTURE ]</text>
        <text x="320" y="195" fill="#e2e8f0" font-family="monospace" font-size="12" text-anchor="middle">${label}</text>
        <text x="320" y="320" fill="#8896aa" font-family="monospace" font-size="10" text-anchor="middle">${subtext}</text>
        <text x="320" y="336" fill="#ef4444" font-family="monospace" font-size="9" text-anchor="middle">AI-GENERATED FICTIONAL EVIDENCE</text>
      </svg>
    `.trim();

    const buffer = Buffer.from(svg, "utf-8");
    return await this.saveMedia(buffer, `${label}.svg`, "image/svg+xml");
  }
}

export const mediaStorageService = new MediaStorageService();

