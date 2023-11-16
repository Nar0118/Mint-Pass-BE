import { Request, Response } from "express";
import { Invitation } from "../../models/Invitation";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";
import { search } from "../../util/functions/search";
import { SearchFunctionEnums } from "../../../src/util/helpers";

export const getAllInvitations = async (req: Request, res: Response) => {
  try {
    const { startIndex, limit } = req.pagination;

    const invitationsCount = await Invitation.collection.countDocuments();
    const invitations = await Invitation.find()
      .skip(startIndex)
      .populate("sender")
      .limit(limit);

    return res
      .status(HttpStatusCodes.OK)
      .send({ data: invitations, count: invitationsCount });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, error: err });
  }
};

export const deleteInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Invitation.deleteOne({ _id: id });
    return res
      .status(HttpStatusCodes.NO_CONTENT)
      .send({ success: result.deletedCount > 0 });
  } catch (err) {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .send({ success: false, error: err });
  }
};

export const searchInvitations = async (req: Request, res: Response) => {
  search(
    req,
    res,
    SearchFunctionEnums.RECIPIENT,
    Invitation,
    SearchFunctionEnums.RECIPIENT
  );
};
