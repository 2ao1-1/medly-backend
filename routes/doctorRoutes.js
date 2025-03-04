import express from "express";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js"; // ✅ استخدم {} مع export

import {
  registerDoctor,
  loginDoctor,
  uploadDocuments,
  getDoctorProfile,
  updateDoctorProfile,
  verifyDoctor,
  forgotPassword,
  resetPassword,
} from "../controllers/doctorController.js";

import { uploadDoctorDocuments } from "../utils/cloudinaryConfig.js"; // ✅ لرفع الملفات

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: API for doctor registration, authentication, and verification
 */

/**
 * @swagger
 * /api/doctor/register:
 *   post:
 *     summary: Register a new doctor
 *     description: Create a new doctor profile with required details and upload verification documents.
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. Abo Nancy"
 *               specialty:
 *                 type: string
 *                 example: "Cardiologist"
 *               title:
 *                 type: string
 *                 example: "Consultant"
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *               email:
 *                 type: string
 *                 example: "doctor@example.com"
 *               password:
 *                 type: string
 *                 example: "12345678"
 *               documents:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Doctor registered successfully, pending admin approval
 *       400:
 *         description: Email or phone already registered
 */
// ✅ تسجيل الطبيب ورفع الوثائق
router.post(
  "/register",
  uploadDoctorDocuments.array("documents", 3),
  registerDoctor
);

/**
 * @swagger
 * /api/doctor/login:
 *   post:
 *     summary: Doctor login
 *     description: Authenticate a doctor and return a JWT token.
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "doctor@example.com"
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 */
// ✅ تسجيل الدخول
router.post("/login", loginDoctor);

/**
 * @swagger
 * /api/doctor/profile:
 *   get:
 *     summary: Get doctor profile
 *     description: Retrieve the authenticated doctor's profile.
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 */
// ✅ جلب بيانات الطبيب
router.get("/profile", authenticateToken, getDoctorProfile);

/**
 * @swagger
 * /api/doctor/profile:
 *   put:
 *     summary: Update doctor profile
 *     description: Update doctor information including profile picture.
 *     tags: [Doctors]
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
 *                 example: "Dr. Abo Nancy"
 *               specialty:
 *                 type: string
 *                 example: "Neurologist"
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
// ✅ تعديل بيانات الطبيب
router.put(
  "/profile",
  authenticateToken,
  uploadDoctorDocuments.single("avatar"),
  updateDoctorProfile
);

/**
 * @swagger
 * /api/doctor/verify:
 *   post:
 *     summary: Verify doctor account (Admin only)
 *     description: Admin approves the doctor account after reviewing documents.
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *                 example: "64a5f2c3e4b0f4a5c3d2e1b6"
 *     responses:
 *       200:
 *         description: Doctor verified successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
// ✅ تحقق الطبيب من خلال الأدمن
router.post("/verify", authenticateToken, isAdmin, verifyDoctor);

/**
 * @swagger
 * /api/doctor/forgot-password:
 *   post:
 *     summary: Doctor forgot password
 *     description: Send password reset link to doctor's email.
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "doctor@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Doctor not found
 */
// ✅ نسيان كلمة المرور
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/doctor/reset-password:
 *   post:
 *     summary: Reset doctor password
 *     description: Reset password using a valid token.
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "NewStrongPass123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or weak password
 */
// ✅ إعادة تعيين كلمة المرور
router.post("/reset-password", resetPassword);

export default router;
