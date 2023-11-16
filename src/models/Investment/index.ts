import * as mongoose from "mongoose";
import { User } from "../User";

export enum Status {
  LIVE = "Live",
}

export enum ClaimingPortals {
  COMINGSOON = "Coming soon",
}

const Schema = mongoose.Schema;

const investmentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amountInvested: {
    type: Number,
    default: 0,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  companyImage: {
    type: "string",
    default: null,
  },
  investmentDate: {
    type: Number,
    default: Date.now,
  },
  paymentDate: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: Status,
    default: Status.LIVE,
  },
  claimingPortals: {
    type: String,
    enum: ClaimingPortals,
    default: ClaimingPortals.COMINGSOON,
  },
  saftId: {
    type: String,
    default: null,
  },
  fundingPoolId: {
    type: Schema.Types.ObjectId,
    ref: "FundingPool",
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  transactionHash: {
    type: String,
    default: null,
  },
  successfullyCompleted: {
    type: Boolean,
    default: false,
  },
  gas: {
    type: Number,
    default: null,
  },
});

export const Investment = mongoose.model("Investment", investmentSchema);
