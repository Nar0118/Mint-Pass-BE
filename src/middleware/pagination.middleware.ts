import { Request, Response } from "express";
import Joi from "joi";
import { HttpStatusCodes } from "../util/enums/httpStatusCode";

declare global {
  namespace Express {
    interface Request {
      pagination: {
        page: number;
        limit: number;
        startIndex: number;
        endIndex: number;
      };
    }
  }
}

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(0).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  startIndex: Joi.number().integer().min(0).default(0),
});

export const paginationMiddleware = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error, value } = paginationSchema.validate(req.query);
  if (error) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }

  const { limit, startIndex, offset } = value;
  const page = Math.floor(offset / limit) + 1 || 1;

  req.pagination = {
    page,
    limit,
    startIndex,
    endIndex: startIndex + limit,
  };

  next();
};
