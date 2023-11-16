import { Request, Response } from "express";
import Joi from "joi";
import { HttpStatusCodes } from "../util/enums/httpStatusCode";

export const validateIdSchema = Joi.object().keys({
  id: Joi.number().integer().min(1).required(),
});

export const validateIdMiddleware = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { id } = req.params;
  const { error } = validateIdSchema.validate({ id });

  if (error) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }

  req.params.id = id;
  next();
};
