import { Router } from "express";
import { requireAuthAdmin } from "../../middleware/auth.middleware";
import { paginationMiddleware } from "../..//middleware/pagination.middleware";
import { validateIdMiddleware } from "../../middleware/id-validation.middleware";
import {
  getAllFundingPools,
  getFundingPoolBySlug,
  createFundingPool,
  updateFundingPool,
  deleteFundingPool,
  getCompanyFundingPools,
  getFilteredPools,
  getPastDeals,
  addFundraisingSC,
  getFoundingPoolSafts,
  searchFundingPools,
} from "./FundingPool.api.handlers";

const router = Router();

router.get("/", paginationMiddleware, getAllFundingPools);
router.get("/featured/projects", getFilteredPools);
router.get("/search", paginationMiddleware, searchFundingPools);
router.get("/:slug", getFundingPoolBySlug);
router.get("/company/:companyId", paginationMiddleware, getCompanyFundingPools);
router.get("/:fundingPoolId/getAllSafts", getFoundingPoolSafts);
router.get("/pastDeals/companies", getPastDeals);
router.post("/", requireAuthAdmin, createFundingPool);
router.post(
  "/:id/addFundraisingSC",
  requireAuthAdmin,
  validateIdMiddleware,
  addFundraisingSC
);
router.put("/:id", requireAuthAdmin, validateIdMiddleware, updateFundingPool);
router.delete(
  "/:id",
  requireAuthAdmin,
  validateIdMiddleware,
  deleteFundingPool
);

export default router;
