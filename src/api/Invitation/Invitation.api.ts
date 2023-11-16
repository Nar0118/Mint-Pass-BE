import { Router } from "express";
import { requireAuthAdmin } from "../../middleware/auth.middleware";
import { paginationMiddleware } from "../../middleware/pagination.middleware";
import { validateIdMiddleware } from "../../middleware/id-validation.middleware";
import { getAllInvitations } from "./Invitation.api.handlers";
import { deleteInvitation } from "./Invitation.api.handlers";

const router = Router();

router.get("/", requireAuthAdmin, paginationMiddleware, getAllInvitations);
router.delete("/:id", requireAuthAdmin, validateIdMiddleware, deleteInvitation);

export default router;
