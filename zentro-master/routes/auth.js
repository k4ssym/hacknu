import express from "express";
import { 
  sendVerificationCode, 
  verifyCodeAndRegister, 
  login 
} from "../controllers/authController.js";

const router = express.Router();

// 2FA Registration Flow
router.post("/send-code", sendVerificationCode);
router.post("/verify-code", verifyCodeAndRegister);

// Login
router.post("/signin", login);

export default router;