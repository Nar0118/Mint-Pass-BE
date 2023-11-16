import { Request, NextFunction, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { format } from "util";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";
import env from "../../util/constants/env";

const { projectId, bucketName } = env;

const storage = new Storage({
  projectId,
  credentials: {
    client_email: env.googleServiceClientEmail,
    private_key: env.googleServicePrivateKey,
  },
});
const bucket = storage.bucket(bucketName);

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();
  blobStream.on("error", (err) => {
    next(err);
  });

  blobStream.on("finish", (): void => {
    const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    const publicUrl = format(url);
    res.status(HttpStatusCodes.OK).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
};

export const removeFile = async (url: string): Promise<void> => {
  storage.bucket(bucketName).file(url).delete({ ignoreNotFound: true });
};
