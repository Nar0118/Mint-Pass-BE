import { Request, Response } from "express";
import { User } from "../../models/User";
import { KycEventStatus, KycRequestStatus } from "../../util/helpers";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";

export const kycProcess = async (req: Request, res: Response) => {
  try {
    const { identification_id } = req.params;
    const { Event, RequestStatus } = req.body;
    const user = await User.findOne({ identificationId: identification_id });

    if (!user) {
      throw new Error(
        `Could not find user with ${identification_id} identification id`
      );
    }

    if (user.kycPassed) {
      throw new Error(`${user.email} already passed KYC successfully`);
    }

    user.kycPassed =
      Event === KycEventStatus.CROSS_CHECKED &&
      (RequestStatus === KycRequestStatus.AUTO_FINISH ||
        RequestStatus === KycRequestStatus.MANUAL_FINISH);

    await user.save();
    return res.sendStatus(HttpStatusCodes.OK);
  } catch (err) {
    throw new Error(err);
  }
};
