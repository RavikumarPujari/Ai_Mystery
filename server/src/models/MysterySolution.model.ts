import mongoose, { Document, Schema, Types } from "mongoose";
import {
  AuthoritativeTimelineEvent,
  SuspectTruthRecord,
} from "../types/mystery.types.js";

export interface IMysterySolution extends Document {
  mysteryId: Types.ObjectId;
  culpritSuspectId: string;
  motive: string;
  opportunity: string;
  method: string;
  explanation: string;
  authoritativeTimeline: AuthoritativeTimelineEvent[];
  decisiveEvidenceIds: string[];
  redHerringExplanations: string[];
  suspectTruthRecords: SuspectTruthRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const AuthoritativeTimelineEventSchema = new Schema(
  {
    id: { type: String, required: true },
    time: { type: String, required: true },
    trueEvent: { type: String, required: true },
    actors: [{ type: String }],
    isContradictedByLies: { type: Boolean, default: false },
    correspondingEvidenceIds: [{ type: String }],
  },
  { _id: false }
);

const SuspectTruthRecordSchema = new Schema(
  {
    suspectId: { type: String, required: true },
    isCulprit: { type: Boolean, required: true },
    trueAlibi: { type: String, required: true },
    statedAlibi: { type: String, required: true },
    liesTold: [{ type: String }],
    factsKnown: [{ type: String }],
  },
  { _id: false }
);

const MysterySolutionSchema = new Schema<IMysterySolution>(
  {
    mysteryId: {
      type: Schema.Types.ObjectId,
      ref: "Mystery",
      required: true,
      unique: true,
      index: true,
    },
    culpritSuspectId: {
      type: String,
      required: true,
    },
    motive: {
      type: String,
      required: true,
    },
    opportunity: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    authoritativeTimeline: [AuthoritativeTimelineEventSchema],
    decisiveEvidenceIds: [{ type: String }],
    redHerringExplanations: [{ type: String }],
    suspectTruthRecords: [SuspectTruthRecordSchema],
  },
  {
    timestamps: true,
  }
);

export const MysterySolutionModel = mongoose.model<IMysterySolution>(
  "MysterySolution",
  MysterySolutionSchema
);

