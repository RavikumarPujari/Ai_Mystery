import mongoose, { Document, Schema, Types } from "mongoose";

export interface IInvestigation extends Document {
  mysteryId: Types.ObjectId;
  userId?: Types.ObjectId;
  guestSessionId?: string;
  status: "in_progress" | "completed" | "abandoned";
  reviewedEvidenceIds: string[];
  submittedSuspectId?: string;
  reasoning?: string;
  isCorrect?: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvestigationSchema = new Schema<IInvestigation>(
  {
    mysteryId: {
      type: Schema.Types.ObjectId,
      ref: "Mystery",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestSessionId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true,
    },
    reviewedEvidenceIds: [
      {
        type: String,
      },
    ],
    submittedSuspectId: {
      type: String,
    },
    reasoning: {
      type: String,
      maxlength: 2000,
    },
    isCorrect: {
      type: Boolean,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for history lookups
InvestigationSchema.index({ userId: 1, createdAt: -1 });
InvestigationSchema.index({ guestSessionId: 1, createdAt: -1 });
InvestigationSchema.index({ mysteryId: 1, guestSessionId: 1 });

export const InvestigationModel = mongoose.model<IInvestigation>(
  "Investigation",
  InvestigationSchema
);

