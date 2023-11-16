import * as mongoose from "mongoose";
import { dateParser } from "../../util/helpers";

export enum Deals {
  SEED_ROUND_1 = "Seed Round",
  SEED_ROUND_2 = "Seed Round 1",
}

export enum Status {
  LIVE = "LIVE",
  COMING_SOON = "COMING SOON",
  DRAFT = "DRAFT",
}

export enum SaleType {
  EXCLUSIVE = "EXCLUSIVE",
  NORMAL = "NORMAL",
}

const currentDate = dateParser(new Date());
const saftDefaultCurrentDate = new Date();
const Schema = mongoose.Schema;

const saftFileSchema = new Schema({
  saftId: { type: String, default: null },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  procedureId: {
    type: String,
    default: null,
  },
  signatureId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Number,
    default: saftDefaultCurrentDate,
  },
});

const fundingPoolSchema = new Schema({
  slug: {
    type: String,
    unique: true,
    dropDups: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  auctionStart: {
    type: Number,
    default: currentDate,
  },
  auctionEnd: {
    type: Number,
    required: true,
  },
  pricePerToken: {
    type: String,
    required: true,
  },
  vesting: {
    type: String,
    required: true,
  },
  launchpads: {
    type: String,
    required: true,
  },
  backers: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: null,
  },
  minAmount: {
    type: Number,
    required: true,
  },
  maxAmount: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  saleType: {
    type: String,
    enum: SaleType,
    default: null,
  },
  status: {
    type: String,
    enum: Status,
    default: null,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  templateId: {
    type: String,
    default: null,
  },
  saftFiles: {
    type: [saftFileSchema],
    default: null,
  },
  walletAddress: {
    type: String,
    default: null,
  },
  contractAddress: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  referrerFee: {
    type: Number,
    require: true,
  },
  createdAt: {
    type: Number,
    default: currentDate,
  },
});

export const FundingPool = mongoose.model("FundingPool", fundingPoolSchema);
