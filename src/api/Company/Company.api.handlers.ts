import { Request, Response } from "express";
import { removeFile } from "../GoogleStorage/GoogleStorage.api.handlers";
import { Company } from "../../models/Company";
import { FundingPool } from "../../models/FundingPool";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";
import { search } from "../../util/functions/search";
import { SearchFunctionEnums } from "../../../src/util/helpers";

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const company = await Company.create({ ...req.body });

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, data: company });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err.message });
  }
};

export const searchCompanies = async (req: Request, res: Response) => {
  search(req, res, SearchFunctionEnums.NAME, Company, SearchFunctionEnums.NAME);
};

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const { startIndex, limit } = req.pagination;

    const companiesCount = await Company.collection.countDocuments();
    const currentLimit = limit === 0 ? companiesCount : limit;
    const companies = await Company.aggregate([
      {
        $lookup: {
          from: "fundingpools",
          localField: "_id",
          foreignField: "company",
          as: "fundingpools",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: currentLimit },
    ]).exec();
    return res
      .status(HttpStatusCodes.OK)
      .json({ data: companies, count: companiesCount });
  } catch {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: "Company does not exist!" });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    return res.status(HttpStatusCodes.OK).json(company);
  } catch {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: "Company does not exist!" });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await Company.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: company });
  } catch {
    return res
      .status(HttpStatusCodes.NOT_FOUND)
      .json({ success: false, error: "Company does not exist!" });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await Company.findById({ _id: id });

    await FundingPool.deleteMany({ company: id });
    const companyDelete = await Company.deleteOne({ _id: id });

    if (companyDelete.ok && company.iconUrl) {
      const url = company?.iconUrl.substring(
        company?.iconUrl.lastIndexOf("/") + 1
      );

      removeFile(url);
    }

    company.fundingTeam.forEach((member) => {
      const url = member.memberImg;
      if (companyDelete && url) {
        const filename = url.substring(url.lastIndexOf("/") + 1);
        removeFile(filename);
      }
    });

    return res.status(HttpStatusCodes.NO_CONTENT).json({ success: true });
  } catch (err) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ success: false, error: err });
  }
};
