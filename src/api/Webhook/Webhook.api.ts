import { Router } from "express";
import { kycProcess } from "./Webhook.api.handlers";

const router = Router();

router.post("/:identification_id/receive", kycProcess);

export default router;
