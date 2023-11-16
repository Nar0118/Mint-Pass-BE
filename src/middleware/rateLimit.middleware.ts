import rateLimit from "express-rate-limit";
import { getKey } from "../util/functions/ipKey";

export const rateLimitMiddleware = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  keyGenerator: getKey,
  message: "Too many requests",
});
