import { Router } from "express";
import {
  requireAuth,
  requireAuthAdmin,
} from "../../middleware/auth.middleware";
import { paginationMiddleware } from "../../middleware/pagination.middleware";
import { validateIdMiddleware } from "../../middleware/id-validation.middleware";
import {
  getAllInvestments,
  registerInvestment,
  checkUserInvestmentForCompany,
  signInvestment,
  verifySign,
  deleteInvestment,
  makeAnInvestment,
  isInvestmentExist,
  getInvestAmountSummary,
  putInvestmentGas,
  searchInvestments,
} from "./Investment.api.handlers";

const router = Router();

router.post("/verify", requireAuth, verifySign);
router.get("/search", paginationMiddleware, searchInvestments);
router.post("/sign/:templateId", requireAuth, signInvestment);
router.post("/:companyId", requireAuth, registerInvestment);
router.put("/:id/invest", requireAuth, validateIdMiddleware, makeAnInvestment);
router.put(
  "/:id/gasPrice",
  requireAuth,
  validateIdMiddleware,
  putInvestmentGas
);
router.get("/amountSummary/:slug", requireAuth, getInvestAmountSummary);
router.get("/", requireAuthAdmin, paginationMiddleware, getAllInvestments);
router.get("/exist", requireAuth, isInvestmentExist);
router.get("/check/:companyId", requireAuth, checkUserInvestmentForCompany);
router.delete("/", deleteInvestment);

export default router;
