import express from "express";
import {
  forgotPassword,
  resetPassword,
  verifyOtp,
} from "../controllers/passwordController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Password Recovery
 *   description: API for requesting password reset, verifying OTP, and resetting password
 */

/**
 * @swagger
 * /api/password/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: User requests to reset their password by providing an email. A reset link or OTP is sent.
 *     tags: [Password Recovery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Password reset link or OTP sent successfully
 *       404:
 *         description: User with this email not found
 */
// ✅ طلب استعادة كلمة المرور
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/password/verify-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     description: User enters the OTP received via email or SMS to verify identity.
 *     tags: [Password Recovery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
// ✅ التحقق من كود OTP
router.post("/verify-otp", verifyOtp);

/**
 * @swagger
 * /api/password/reset-password:
 *   post:
 *     summary: Reset password
 *     description: User sets a new password after verifying their identity.
 *     tags: [Password Recovery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "NewPass123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid request or weak password
 *       404:
 *         description: User not found
 */
// ✅ إعادة تعيين كلمة المرور
router.post("/reset-password", resetPassword);

export default router;
