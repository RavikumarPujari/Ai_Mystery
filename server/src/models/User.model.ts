import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  displayName: string;
  email: string;
  passwordHash?: string;
  authProvider: "local" | "guest";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false, // Hidden by default from queries
    },
    authProvider: {
      type: String,
      enum: ["local", "guest"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);

