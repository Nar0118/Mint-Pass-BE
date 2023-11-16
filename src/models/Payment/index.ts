import * as mongoose from "mongoose";
import { User } from "../User";
import { dateParser } from "../../util/helpers";

const defaultCurrentDate = dateParser(new Date());
const { Schema } = mongoose;

const paymentSchema = new Schema({
  credit: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Number,
    default: defaultCurrentDate,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
});

export const Payment = mongoose.model("Payment", paymentSchema);
