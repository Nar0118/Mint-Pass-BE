import { Request, Response } from "express";
import { axiosInstance } from "../../util/yousign/saft.util.yousign";
import { FundingPool, Status } from "../../models/FundingPool";
import {
  dateParser,
  featuredPoolsFilterEnum,
  fundingPoolsFilterEnum,
} from "../../util/helpers";
import { HttpStatusCodes } from "../../util/enums/httpStatusCode";
import { search } from "../../util/functions/search";
import { SearchFunctionEnums } from "../../../src/util/helpers";

export const searchFundingPools = async (req: Request, res: Response) => {
  search(
    req,
    res,
    SearchFunctionEnums.SLUG,
    FundingPool,
    SearchFunctionEnums.SLUG
  );
};

export const createFundingPool = async (req: Request, res: Response) => {
  try {
    const { auctionStart, auctionEnd } = req.body;

    const fundingPool = await FundingPool.create({
      ...req.body,
      auctionStart: dateParser(auctionStart),
      auctionEnd: dateParser(auctionEnd),
    });

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ success: true, data: fundingPool });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const addFundraisingSC = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contractAddress } = req.body;

    const fundingPool = await FundingPool.findByIdAndUpdate(
      id,
      {
        contractAddress,
      },
      {
        new: true,
      }
    );
    if (!fundingPool) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: "FundingPools does not exist!",
      });
    }

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: fundingPool });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

const featuredPoolsFilter = async (filter: string, currentDate: number) => {
  let necessaryFilter: any;

  switch (filter) {
    case featuredPoolsFilterEnum.ONGOING_FUNDING_POOLS:
      necessaryFilter = poolsUserTypeFilter(
        fundingPoolsFilterEnum.LIVE_DEALS,
        currentDate
      );
      break;
    case featuredPoolsFilterEnum.UPCOMING_FUNDING_POOLS:
      necessaryFilter = poolsUserTypeFilter(
        fundingPoolsFilterEnum.UPCOMING_DEALS,
        currentDate
      );
      break;
    default:
      return;
  }

  const poolsCount = await FundingPool.collection.countDocuments(
    necessaryFilter
  );

  return {
    necessaryFilter,
    count: poolsCount,
  };
};

export const getFilteredPools = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit);
    const now = new Date(Date.now());
    const currentDate = dateParser(now);
    const filter = req.query.filter;

    if (filter === featuredPoolsFilterEnum.ALL) {
      const upcomingFilter = await featuredPoolsFilter(
        featuredPoolsFilterEnum.UPCOMING_FUNDING_POOLS,
        currentDate
      );

      const upcoming = await FundingPool.find(upcomingFilter.necessaryFilter)
        .limit(limit)
        .populate("company")
        .populate("backers")
        .exec();

      const ongoingFilter = await featuredPoolsFilter(
        featuredPoolsFilterEnum.ONGOING_FUNDING_POOLS,
        currentDate
      );

      const ongoing = await FundingPool.find(ongoingFilter.necessaryFilter)
        .limit(limit)
        .populate("company")
        .populate("backers")
        .exec();

      return res.status(HttpStatusCodes.OK).json({
        data: { ongoing, upcoming },
        ongoingCount: ongoingFilter.count,
        upcomingCount: upcomingFilter.count,
        success: true,
      });
    } else {
      const filterCaseFunding = await featuredPoolsFilter(
        String(filter),
        currentDate
      );

      const data = await FundingPool.find(filterCaseFunding.necessaryFilter)
        .limit(limit)
        .populate("company")
        .populate("backers")
        .exec();

      return res.status(HttpStatusCodes.OK).json({
        data,
        count: filterCaseFunding.count,
        success: true,
      });
    }
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

const poolsUserTypeFilter = (filter: string, currentDate: number) => {
  if (fundingPoolsFilterEnum.UPCOMING_DEALS === filter) {
    return {
      $or: [
        {
          $and: [
            {
              auctionStart: {
                $gte: currentDate,
              },
            },
            {
              status: {
                $ne: Status.DRAFT,
              },
            },
          ],
        },
        {
          status: {
            $eq: Status.COMING_SOON,
          },
        },
      ],
    };
  } else {
    return {
      auctionEnd: {
        $gte: currentDate,
      },
      auctionStart: {
        $lte: currentDate,
      },
      status: {
        $eq: Status.LIVE,
      },
    };
  }
};

const fundingPoolsFilter = (filter: string, currentDate: number) => {
  switch (filter) {
    case fundingPoolsFilterEnum.FINISHED_DEALS:
      return {
        auctionEnd: {
          $lte: currentDate,
        },
        status: {
          $nin: [Status.COMING_SOON, Status.DRAFT],
        },
      };
    case fundingPoolsFilterEnum.UPCOMING_DEALS:
      return poolsUserTypeFilter(
        fundingPoolsFilterEnum.UPCOMING_DEALS,
        currentDate
      );
    case fundingPoolsFilterEnum.LIVE_DEALS:
      return poolsUserTypeFilter(
        fundingPoolsFilterEnum.LIVE_DEALS,
        currentDate
      );
    case fundingPoolsFilterEnum.ALL:
      return {
        status: {
          $ne: Status.DRAFT,
        },
      };
    default:
      return;
  }
};

export const getAllFundingPools = async (req: Request, res: Response) => {
  try {
    const { startIndex, limit } = req.pagination;
    const { filter } = req.query;

    const now = new Date(Date.now());
    const currentDate = dateParser(now);
    const filterCase = fundingPoolsFilter(String(filter), currentDate);

    const fundingPoolsCount = await FundingPool.collection.countDocuments(
      filterCase
    );
    const fundingPools = await FundingPool.find(filterCase)
      .limit(limit)
      .skip(startIndex)
      .populate("company")
      .populate("backers")
      .sort({ createdAt: -1 })
      .exec();

    if (!fundingPools) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: "FundingPools does not exist!",
      });
    }
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: fundingPools,
      count: fundingPoolsCount,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getFundingPoolBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const fundingPool = await FundingPool.findOne({
      slug,
    })
      .populate("company")
      .populate("backers")
      .exec();

    if (!fundingPool) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ success: false, error: "FundingPool does not exist!" });
    }

    const now = new Date(Date.now());
    const currentDate = dateParser(now);

    const canInvest =
      fundingPool.auctionEnd >= currentDate &&
      fundingPool.auctionStart <= currentDate &&
      fundingPool.contractAddress &&
      fundingPool.status === Status.LIVE;

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: fundingPool,
      canInvest,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

const companyPoolsFilter = (count: number, companyId: string) => {
  if (count >= 0) {
    return {
      company: companyId,
    };
  }

  return {
    company: companyId,
    status: {
      $ne: Status.DRAFT,
    },
  };
};

export const getCompanyFundingPools = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { startIndex, limit } = req.pagination;

    const filter = companyPoolsFilter(startIndex, companyId);
    const fundingPoolsCount = await FundingPool.where(filter).countDocuments();

    const fundingPool = await FundingPool.find(filter)
      .skip(startIndex)
      .limit(limit)
      .populate("company")
      .populate("backers")
      .sort({ createdAt: -1 })
      .exec();

    if (!fundingPool) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: "FundingPools does not exist!",
      });
    }

    return res.status(HttpStatusCodes.OK).json({
      data: fundingPool,
      success: true,
      count: fundingPoolsCount,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getPastDeals = async (req: Request, res: Response) => {
  try {
    const date = Date.now();

    const pastDeals = await FundingPool.aggregate([
      {
        $match: {
          auctionEnd: {
            $lte: date,
          },
        },
      },
      { $group: { _id: "$company" } },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "companies",
        },
      },
      {
        $project: {
          "companies.iconUrl": 1,
          "companies.name": 1,
        },
      },
    ]).exec();

    if (!pastDeals.length) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: "pastDeals not found", success: false });
    }

    return res.status(HttpStatusCodes.OK).json({
      data: pastDeals,
      success: true,
    });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const updateFundingPool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { auctionStart, auctionEnd } = req.body;

    const fundingPool = await FundingPool.findByIdAndUpdate(
      id,
      {
        ...req.body,
        auctionStart: dateParser(auctionStart),
        auctionEnd: dateParser(auctionEnd),
      },
      {
        new: true,
      }
    );
    if (!fundingPool) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        success: false,
        error: "FundingPools does not exist!",
      });
    }

    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: fundingPool });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const deleteFundingPool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await FundingPool.deleteOne({ _id: id });

    return res.status(HttpStatusCodes.NO_CONTENT).json({ success: true });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: err });
  }
};

export const getFoundingPoolSafts = async (req: Request, res: Response) => {
  const { fundingPoolId } = req.params;
  const saftPDFs: Array<string> = [];

  try {
    const fundingPool = await FundingPool.findOne({
      _id: fundingPoolId,
    });

    await Promise.all(
      fundingPool.saftFiles.map(
        async (item: {
          saftId: string;
          procedureId: string;
          signatureId: string;
          ownerId: string;
          isValid: boolean;
        }) => {
          if (item.saftId) {
            const pdf = await axiosInstance.get(`${item?.saftId}/download`);
            if (!pdf?.data) {
              return res.status(HttpStatusCodes.NOT_FOUND).json({
                success: false,
                message: "No Saft pdf found for this investment",
              });
            }
            const base64Pdf = pdf.data;
            saftPDFs.push(base64Pdf);
          }
        }
      )
    );
    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, data: saftPDFs });
  } catch (err) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: err.message });
  }
};
