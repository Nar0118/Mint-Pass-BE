import * as mongoose from "mongoose";
import { dateParser } from "../../util/helpers";

export enum SocialMedia {
  INSTAGRAM = "instagram",
  TELEGRAM = "telegram",
  LINKEDIN = "linkedin",
  DISCORD = "discord",
  MEDIUM = "medium",
  TWITTER = "twitter",
}

const Schema = mongoose.Schema;
const detailSchema = new Schema({
  detail: { type: String, required: false },
  description: {
    type: String,
    required: false,
  },
});

const currentDate = dateParser(new Date());
const fundingTeamSchema = new Schema({
  memberImg: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: false },
  position: { type: String, required: true },
  linkedinLink: { type: String, required: false },
});

const fundingSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    default: currentDate,
  },
  category: {
    type: String,
    required: true,
  },
  websiteUrl: {
    type: String,
    required: false,
  },
  iconUrl: {
    type: String,
    default: null,
  },
  details: {
    type: [detailSchema],
    required: false,
  },
  fundingTeam: {
    type: [fundingTeamSchema],
    required: false,
  },
  socialMedia: {
    type: [
      {
        media: {
          type: String,
          enum: SocialMedia,
          default: SocialMedia.TELEGRAM,
        },
        url: { type: String, required: true },
      },
    ],
    required: false,
  },
});

export const Company = mongoose.model("Company", fundingSchema);
