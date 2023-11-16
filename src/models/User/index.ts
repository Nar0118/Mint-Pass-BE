import * as mongoose from "mongoose";
import * as shortid from "shortid";
import { dateParser } from "../../util/helpers";

export enum UserRoles {
  BASIC = "basic",
  ADMIN = "admin",
}

const Schema = mongoose.Schema;

const TwoFactorSchema = new Schema({
  code: { type: String, required: true },
  sendedAt: {
    type: Number,
    default: dateParser(new Date()),
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new Schema({
  name: {
    type: String,
    default: null,
  },
  surname: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: null,
  },
  twitterLink: {
    type: String,
    default: null,
  },
  instagramLink: {
    type: String,
    default: null,
  },
  discordLink: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  nationality: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    default: null,
    select: false,
  },
  role: {
    type: String,
    default: UserRoles.BASIC,
    enum: UserRoles,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  walletAddresses: {
    type: [String],
    default: null,
  },
  authenticatedByGoogle: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  twitterId: {
    type: String,
    default: null,
  },
  authenticatedByTwitter: {
    type: Boolean,
    default: false,
  },
  creditAmount: {
    type: Number,
    default: 0,
  },
  identificationId: {
    type: String,
    default: null,
  },
  primaryWalletAddress: {
    type: String,
    default: null,
  },
  kycPassed: {
    type: Boolean,
    default: false,
  },
  referralCode: {
    type: String,
    required: true,
    default: shortid.generate,
  },
  enable2fa: {
    type: Boolean,
    default: false,
  },
  twoFaCode: {
    type: TwoFactorSchema,
    default: null,
  },
});

export const User = mongoose.model("User", userSchema);
