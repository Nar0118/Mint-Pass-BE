import { Router } from "express";
import Multer from "multer";
import {
  requireAuth,
  requireAuthAdmin,
} from "../../../middleware/auth.middleware";
import { paginationMiddleware } from "../../../middleware/pagination.middleware";
import { validateIdMiddleware } from "../../../middleware/id-validation.middleware";
import {
  getAllUsers,
  updateCurrentUser,
  deleteUser,
  signup,
  login,
  loginForAdmin,
  changePassword,
  getCurrentUser,
  updateUserById,
  createUser,
  inviteFriends,
  getUserReferrals,
  getUserInvestments,
  logout,
  signupByGoogle,
  loginByGoogle,
  twitter,
  //pass2FA,
  //resend2FA,
  twitterCallback,
  sendRecoverPasswordEmail,
  updateForgottenPassword,
  updateWallet,
  downloadSaft,
  userValidationCheckingByEmail,
  getUserWallet,
  startKYC,
  searchUsers,
  getKycMedia,
  getReferredUserWallet,
  getKycDocument,
  deleteWallet,
} from "./User.api.handlers";
import { uploadFile } from "../../GoogleStorage/GoogleStorage.api.handlers";
import { multer } from "../../../util/multer/multer-config";

const router = Router();

router.get("/admin", requireAuthAdmin, paginationMiddleware, getAllUsers);
router.get("/referrals", requireAuth, paginationMiddleware, getUserReferrals);
router.get("/referred-user-wallet", requireAuth, getReferredUserWallet);
router.get("/me", requireAuth, getCurrentUser);
router.get(
  "/investments",
  requireAuth,
  paginationMiddleware,
  getUserInvestments
);
router.get("/login/twitter", twitter);
router.get("/twitter/callback", twitterCallback);
router.get(
  "/validation-by-email/:email",
  requireAuth,
  userValidationCheckingByEmail
);
router.get("/wallets", requireAuth, getUserWallet);
router.get("/search", requireAuth, paginationMiddleware, searchUsers);
router.get("/media/:identificationId", requireAuth, getKycMedia);
router.get("/kyc-document", requireAuth, getKycDocument);
router.post("/signup", signup);
router.post("/login", login);
router.post("/file", multer.single("file"), uploadFile);
router.post("/login/admin", loginForAdmin);
router.post("/signup/google", signupByGoogle);
router.post("/recover-password", sendRecoverPasswordEmail);
router.post("/admin", requireAuthAdmin, createUser);
router.post("/logout", requireAuth, logout);
router.post("/invite-friends", requireAuth, inviteFriends);
router.post("/saft", requireAuth, downloadSaft);
// router.post("/pass-2FA", pass2FA);
// router.post("/resend-2FA", resend2FA);
router.post("/login/google", loginByGoogle);
router.post("/start-kyc", requireAuth, startKYC);
router.put("/", requireAuth, updateCurrentUser);
router.put(
  "/admin/update-user/:id",
  requireAuthAdmin,
  validateIdMiddleware,
  updateUserById
);
router.put("/update-forgotten-password", updateForgottenPassword);
router.put("/change-password", requireAuth, changePassword);
router.put("/update-wallet", requireAuth, updateWallet);
router.delete("/admin/:id", requireAuthAdmin, validateIdMiddleware, deleteUser);
router.delete("/delete-wallet", requireAuthAdmin, deleteWallet);

export default router;
