import mongoose, { Document, Schema, Types } from "mongoose";
import {
  MysteryDifficulty,
  MysteryGenre,
  MysteryStatus,
  PublicCaseData,
} from "../types/mystery.types.js";

export interface IMystery extends Document {
  ownerId?: Types.ObjectId;
  guestSessionId?: string;
  title: string;
  originalScenario: string;
  genre: MysteryGenre;
  difficulty: MysteryDifficulty;
  status: MysteryStatus;
  generationVersion: string;
  publicCase: PublicCaseData;
  createdAt: Date;
  updatedAt: Date;
}

const PublicSuspectSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    relationship: { type: String, required: true },
    initialStatement: { type: String, required: true },
    knownMotive: { type: String },
    alibiInfo: { type: String },
    avatarUrl: { type: String },
  },
  { _id: false }
);

const PublicEvidenceSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["chat", "cctv", "image", "witness_statement", "document", "digital_record", "timeline"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    source: { type: String, required: true },
    occurredAt: { type: String },
    relatedSuspectIds: [{ type: String }],
    relatedEventIds: [{ type: String }],
    content: { type: Schema.Types.Mixed, required: true },
    mediaAssetIds: [{ type: String }],
  },
  { _id: false }
);

const PublicTimelineEventSchema = new Schema(
  {
    id: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    relatedSuspectIds: [{ type: String }],
    relatedEvidenceIds: [{ type: String }],
    isVerified: { type: Boolean, default: true },
  },
  { _id: false }
);

const PublicCaseDataSchema = new Schema(
  {
    caseNumber: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    location: { type: String, required: true },
    incidentTime: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    genre: { type: String, required: true },
    suspects: [PublicSuspectSchema],
    evidence: [PublicEvidenceSchema],
    timeline: [PublicTimelineEventSchema],
  },
  { _id: false }
);

const MysterySchema = new Schema<IMystery>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestSessionId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalScenario: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      required: true,
      default: "theft",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      default: "medium",
    },
    status: {
      type: String,
      enum: ["generating", "validating", "generating_media", "ready", "failed"],
      default: "generating",
      index: true,
    },
    generationVersion: {
      type: String,
      default: "1.0.0",
    },
    publicCase: {
      type: PublicCaseDataSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
MysterySchema.index({ status: 1, createdAt: -1 });
MysterySchema.index({ ownerId: 1, createdAt: -1 });
MysterySchema.index({ guestSessionId: 1, createdAt: -1 });

export const MysteryModel = mongoose.model<IMystery>("Mystery", MysterySchema);

