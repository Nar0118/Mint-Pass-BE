import { Router } from "express";
import {
  requireAuth,
  requireAuthAdmin,
} from "../../middleware/auth.middleware";
import { paginationMiddleware } from "../../middleware/pagination.middleware";
import { validateIdMiddleware } from "../../middleware/id-validation.middleware";
import {
  getAllCompanies,
  getCompanyById,
  registerCompany,
  updateCompany,
  deleteCompany,
  searchCompanies,
} from "./Company.api.handlers";
import { uploadFile } from "../GoogleStorage/GoogleStorage.api.handlers";
import { multer } from "../../util/multer/multer-config";

const router = Router();

router.get("/", paginationMiddleware, getAllCompanies);
router.get("/:id", validateIdMiddleware, getCompanyById);
router.post("/", requireAuthAdmin, registerCompany);
router.post("/file", multer.single("file"), requireAuthAdmin, uploadFile);
router.put("/:id", requireAuth, validateIdMiddleware, updateCompany);
router.delete("/:id", requireAuthAdmin, validateIdMiddleware, deleteCompany);

export default router;
