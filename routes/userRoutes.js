import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  requestChangeContact,
  confirmChangeContact,
} from "../controllers/userController.js";
import { uploadUserAvatar } from "../utils/cloudinaryConfig.js"; // ✅ استيراد إعدادات Cloudinary

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for managing user profiles
 */

const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile data.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: User not found
 */
// ✅ جلب بيانات المستخدم
router.get("/", authenticateToken, getUserProfile);

/**
 * @swagger
 * /api/user:
 *   put:
 *     summary: Update user profile
 *     description: Update user information including name and avatar.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request or missing fields
 *       401:
 *         description: Unauthorized
 */
// ✅ تحديث بيانات المستخدم مع دعم رفع الصور
router.put(
  "/",
  authenticateToken,
  uploadUserAvatar.single("avatar"),
  updateUserProfile
);

/**
 * @swagger
 * /api/user/request-change-contact:
 *   post:
 *     summary: Request change of email or phone number
 *     description: User requests to change their email or phone number, triggering a verification code.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *                 example: "newemail@example.com"
 *               newPhone:
 *                 type: string
 *                 example: "+201234567890"
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: No new contact provided
 *       401:
 *         description: Unauthorized
 */
// ✅ طلب تغيير الإيميل أو الهاتف
router.post("/request-change-contact", authenticateToken, requestChangeContact);

/**
 * @swagger
 * /api/user/confirm-change-contact:
 *   post:
 *     summary: Confirm change of email or phone number
 *     description: User submits verification code to confirm email or phone number update.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *                 example: "newemail@example.com"
 *               newPhone:
 *                 type: string
 *                 example: "+201234567890"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Contact information updated successfully
 *       400:
 *         description: Invalid or expired verification code
 *       401:
 *         description: Unauthorized
 */
// ✅ تأكيد تغيير الإيميل أو الهاتف
router.post("/confirm-change-contact", authenticateToken, confirmChangeContact);

export default router;
