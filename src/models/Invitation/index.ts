import * as mongoose from "mongoose";
import { User } from "../User";
import { dateParser } from "../../util/helpers";

const defaultCurrentDate = dateParser(new Date());
const Schema = mongoose.Schema;

const invitationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  referralCode: {
    type: String,
    required: true,
    refPath: "User.referralCode",
  },
  createdAt: {
    type: Number,
    default: defaultCurrentDate,
  },
});

export const Invitation = mongoose.model("Invitation", invitationSchema);
