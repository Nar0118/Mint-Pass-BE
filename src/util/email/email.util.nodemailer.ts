import * as nodemailer from "nodemailer";
import { CustomError, ErrorCodes } from "../error/error.util";
import env from "../constants/env";

export interface MailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export enum ServiceType {
  GMAIL = "gmail",
}

export const sendEmail = async (mailOptions: MailOptions): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: ServiceType.GMAIL,
      auth: {
        user: env.defaultEmail,
        pass: env.defaultEmailPassword,
      },
    });

    transporter.sendMail(
      {
        from: mailOptions.from ?? env.defaultEmail,
        ...mailOptions,
      },
      (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );
  } catch (err) {
    throw new CustomError("Failed to send email", ErrorCodes.FAILED_EMAIL_SEND);
  }
};
