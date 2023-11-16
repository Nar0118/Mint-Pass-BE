import { Request } from "express";

export const getKey = (req: Request) => {
  return req.ip;
};
