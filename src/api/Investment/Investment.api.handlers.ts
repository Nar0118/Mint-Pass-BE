import { Request, Response } from "express";
import { Company } from "../../models/Company";
import { Investment } from "../../models/Investment";
import { FundingPool } from "../../models/FundingPool";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";
import { axiosInstance } from "../../util/yousign/saft.util.yousign";
import { search } from "../../util/functions/search";
import { SearchFunctionEnums } from "../../../src/util/helpers";
import { User, AnvilFields } from "../../util/types/saft";
import Anvil from "@anvilco/anvil";
import env from "../../util/constants/env";

export const searchInvestments = async (req: Request, res: Response) => {
  search(
    req,
    res,
    SearchFunctionEnums.COMPANY_NAME,
    Investment,
    SearchFunctionEnums.COMPANY_NAME
  );
};

export const isInvestmentExist = async (req: Request, res: Response) => {
  try {
    const user = req["user"];
    const { fundingPoolId } = req.query;

    const fundingPool = await FundingPool.findById(fundingPoolId);

    const files = fundingPool.saftFiles;
    let filteredFile;
    if (files.length > 0) {
      filteredFile = files.find(
        (item) => item.ownerId == user.id && item.isValid === true
      );
    }

    const investmentIsExist = await Investment.findOne({
      successfullyCompleted: false,
      companyId: fundingPool.company,
      userId: user._id,
      saftId: filteredFile ? filteredFile.saftId : "",
    });

    return res.status(HttpStatusCodes.OK).json({
      success: !!investmentIsExist,
      data: investmentIsExist,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const registerInvestment = async (req: Request, res: Response) => {
  try {
    const user = req["user"];

    const { companyId } = req.params;
    const {
      fundingPoolId,
      saftId,
      procedureId,
      signatureId,
      investedAmount,
    } = req.body;

    const company = await Company.findOne({
      _id: companyId,
    });

    if (!company) {
      return res.status(HttpStatusCodes.NOT_FOUND).send({
        success: false,
        error: "Company not found!",
      });
    }

    const fundingPool = await FundingPool.findById(fundingPoolId);
    if (!fundingPool.backers.includes(user.id)) {
      fundingPool.backers.push(user.id);
    }

    const files = fundingPool.saftFiles;
    let filteredFile;
    if (files.length > 0) {
      filteredFile = files.find(
        (item) => item.ownerId == user.id && item.isValid === true
      );
    }

    const investmentIsExist = await Investment.findOne({
      successfullyCompleted: false,
      companyId: fundingPool.company,
      userId: user._id,
      saftId: filteredFile ? filteredFile.saftId : "",
    });

    if (investmentIsExist) {
      return res.status(HttpStatusCodes.OK).json({
        success: true,
        data: investmentIsExist,
      });
    }

    if (investedAmount <= 0) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Amount is invalid!",
      });
    }

    const createdInvestment = await Investment.create({
      userId: user.id,
      user: user.id,
      companyName: company.name,
      companyId: company._id,
      amountInvested: investedAmount,
      companyImage: company.iconUrl,
      ...req.body,
    });

    fundingPool.saftFiles.push({
      saftId,
      procedureId,
      signatureId,
      ownerId: user.id,
    });
    fundingPool.save();

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, data: createdInvestment });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const makeAnInvestment = async (req: Request, res: Response) => {
  try {
    const user = req["user"];
    const { id } = req.params;
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Transaction failed!",
      });
    }

    const updatedInvestment = await Investment.findByIdAndUpdate(
      id,
      {
        successfullyCompleted: true,
        paymentDate: new Date(Date.now()),
        transactionHash,
      },
      {
        new: true,
      }
    );

    if (!updatedInvestment) {
      return res.status(HttpStatusCodes.CONFLICT).json({
        success: false,
        error: "Your investment has not been successfully completed before!",
      });
    }

    const fundingPool = await FundingPool.findById(
      updatedInvestment.fundingPoolId
    );

    const files = fundingPool.saftFiles;
    const filteredFile = files.find(
      (item) => item.ownerId == user.id && item.isValid === true
    );
    filteredFile.isValid = false;
    fundingPool.save();

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: updatedInvestment });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const putInvestmentGas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { gas } = req.body;

    const updatedInvestment = await Investment.findByIdAndUpdate(id, {
      gas,
    });

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: updatedInvestment });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const checkUserInvestmentForCompany = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req["user"];
    const { companyId } = req.params;

    const investment = await Investment.findOne({
      userId: user.id,
      companyId,
    });

    if (!investment) {
      return res.status(HttpStatusCodes.NOT_FOUND).send({
        success: false,
      });
    }

    return res.status(HttpStatusCodes.NO_CONTENT).send({
      success: true,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getAllInvestments = async (req: Request, res: Response) => {
  try {
    const { startIndex, limit } = req.pagination;

    const investmentsCount = await Investment.collection.countDocuments();
    const investments = await Investment.find()
      .skip(startIndex)
      .limit(limit)
      .populate("user")
      .exec();
    return res
      .status(HttpStatusCodes.OK)
      .send({ data: investments, count: investmentsCount });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, error: err });
  }
};

export const getInvestAmountSummary = async (req: Request, res: Response) => {
  try {
    const user = req["user"];
    const { slug } = req?.params;

    const investments = await Investment.find({
      userId: user._id,
      fundingPoolId: slug,
    }).populate("fundingPool");

    let amount = 0;
    investments.map((inv) => {
      amount += inv.amountInvested;
    });

    return res.status(HttpStatusCodes.OK).send({
      success: true,
      amount,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, error: err });
  }
};

export const signInvestment = async (req: Request, res: Response) => {
  const anvilClient = new Anvil({ apiKey: env.anvilApiKey });
  const { templateId } = req.params;
  const user = req["user"];
  const pdfData: AnvilFields = {
    title: user.id,
    data: {
      name: {
        firstName: user.name ?? "name",
        lastName: user.surname ?? "surname",
      },
      email: user.email,
      dateOfSignature: "",
      amountInvested: req.body.amountInvested.toString(),
      walletOfInvestment: req.body.wallet,
      nationality: user.nationality,
      dateOfBirth: user.dateOfBirth,
      id: user._id,
    },
  };

  try {
    const { statusCode, data } = await anvilClient.fillPDF(templateId, pdfData);

    if (statusCode != 200) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        message: "unable to fill pdf with appropriate information",
      });
    }

    const filledPdf = Buffer.from(data).toString("base64");
    const userData: User = {
      email: user.email,
      firstname: user.name ?? "name",
      lastname: user.surname ?? "surname",
      fields: {
        amountinvested: req.body.amountInvested.toString(),
        walletofinvestement: user.walletOfInvestment,
        datesofbirth: user.dateOfBirth,
        id: user.id,
      },
      operationLevel: "custom",
      operationCustomModes: ["email"],
    };

    const proceduresData = {
      name: user.id,
      start: false,
    };

    const newProcedure = await axiosInstance.post(
      "/procedures",
      proceduresData
    );

    const procedureId = newProcedure.data.id;
    const fileData = {
      name: "saft.pdf",
      content: filledPdf,
      procedure: procedureId,
    };

    const addSaftFile = await axiosInstance.post("/files", fileData);
    const addMember = await axiosInstance.post("/members", {
      ...userData,
      procedure: procedureId,
    });

    const fileObjectBody = {
      file: addSaftFile.data.id,
      member: addMember.data.id,
      page: 0,
    };

    await axiosInstance.post("/file_objects", fileObjectBody);
    await axiosInstance.put(`${procedureId}`, {
      start: true,
    });

    const signingData = {
      mode: "email",
      type: "accept",
      members: [`${addMember.data.id}`],
    };

    const signProcedure = await axiosInstance.post("/operations", signingData);

    const responseData = {
      signatureId: signProcedure.data.authentication.id,
      procedureId: newProcedure.data.id,
      file: filledPdf,
      fileId: addSaftFile.data.id,
    };

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: responseData });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const verifySign = async (req: Request, res: Response) => {
  const { signatureId, code } = req.body;
  const data = { code };
  try {
    const verify = await axiosInstance.put(
      `/authentications/email/${signatureId}`,
      data
    );
    if (verify.status != 200) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ success: false, message: "incorrect code" });
    }

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, message: verify.data });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, error: err.message });
  }
};

export const deleteInvestment = async (req: Request, res: Response) => {
  try {
    const { id, userId, saftId } = req.query;
    const result = await Investment.deleteOne({ _id: id });
    const fundingPools = await FundingPool.updateMany(
      { backers: { $in: [userId] }, saftFiles: { $elemMatch: { saftId } } },
      {
        $pull: {
          saftFiles: { saftId },
          backers: userId,
        },
      }
    );

    return res.status(HttpStatusCodes.OK).send({
      success: fundingPools.nModified >= 0 && result.deletedCount >= 0,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, error: err });
  }
};
