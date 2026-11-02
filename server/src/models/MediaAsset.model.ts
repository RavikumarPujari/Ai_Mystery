import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMediaAsset extends Document {
  caseId: Types.ObjectId;
  evidenceId: string;
  type: "image" | "video" | "audio";
  status: "pending" | "ready" | "failed";
  storageKey?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  promptUsed?: string;
  dataBase64?: string; // Stored for persistent backup across ephemeral deployments (e.g. Render Free)
  tierUsed?: "huggingface" | "pollinations" | "svg_fallback";
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Mystery",
      required: true,
      index: true,
    },
    evidenceId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      default: "image",
    },
    status: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "pending",
    },
    storageKey: {
      type: String,
    },
    url: {
      type: String,
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
    },
    sizeBytes: {
      type: Number,
    },
    promptUsed: {
      type: String,
      select: false, // Don't expose internal prompts
    },
    dataBase64: {
      type: String,
      select: false, // Exclude by default from general queries to save bandwidth
    },
    tierUsed: {
      type: String,
      enum: ["huggingface", "pollinations", "svg_fallback"],
    },
  },
  {
    timestamps: true,
  }
);

MediaAssetSchema.index({ caseId: 1, evidenceId: 1 });
MediaAssetSchema.index({ storageKey: 1 });

export const MediaAssetModel = mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
