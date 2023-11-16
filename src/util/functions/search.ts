import { Request, Response } from "express";
import { SearchFunctionEnums } from "../helpers";

export const search = async (
  req: Request,
  res: Response,
  searchItem: SearchFunctionEnums,
  searchElement,
  key: SearchFunctionEnums
) => {
  try {
    let filterOfBooleans = {};
    let filteredObj;
    Object.keys(req.query).forEach((elem) => {
      if (
        (req.query[elem].length &&
          elem !== "limit" &&
          elem !== "offset" &&
          req.query[elem] !== "undefined") ||
        elem === searchItem
      )
        filteredObj = { ...filteredObj, [elem]: req.query[elem] };
    });

    for (const i in filteredObj) {
      if (filteredObj[i] === "false" || filteredObj[i] === "true") {
        filterOfBooleans = {
          $or: [{ [key]: filteredObj[i] }],
        };
      } else {
        const regexString = encodeURIComponent(filteredObj[i].toLowerCase())
          .replace(/%2B/g, "\\+|")
          .replace(/%20/g, "\\s+");
        let regex;
        if (
          searchItem === SearchFunctionEnums.RECIPIENT ||
          searchItem === SearchFunctionEnums.EMAIL
        ) {
          regex = new RegExp(filteredObj[i], "i");
        } else {
          regex = new RegExp(regexString, "i");
        }

        filteredObj[i] = { $regex: regex };
      }
    }
    const { startIndex, limit } = req.pagination;

    const filter = {
      ...filterOfBooleans,
      ...filteredObj,
    };

    const [data, count] = await Promise.all([
      searchElement
        .find(filter)
        .skip(startIndex)
        .limit(limit)
        .populate("user")
        .exec(),
      searchElement.find(filter).count(),
    ]);

    return res.json({ data, count, success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
};
