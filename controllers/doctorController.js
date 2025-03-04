import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { uploadToCloudinary } from "../utils/cloudinaryConfig.js"; // ✅ استخدم {} لأن التصدير ليس افتراضيًا

import { sendEmail } from "../utils/emailService.js";
// إرسال الإيميلات للأطباء

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

/**
 * ✅ تسجيل الدكتور مع رفع الوثائق
 */
export const registerDoctor = async (req, res) => {
  try {
    const { name, specialty, title, phone, email, password } = req.body;

    // التأكد من عدم تكرار الإيميل أو الهاتف
    const existingDoctor = await prisma.doctor.findFirst({
      where: { OR: [{ phone }, { email }] },
    });
    if (existingDoctor)
      return res
        .status(400)
        .json({ message: "Email or phone already registered" });

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // رفع الوثائق إلى Cloudinary
    let uploadedDocuments = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path);
        uploadedDocuments.push(result.secure_url);
      }
    }

    // إنشاء الحساب مع حالة "غير مفعّل"
    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialty,
        title,
        phone,
        email,
        password: hashedPassword,
        documents: uploadedDocuments,
        isVerified: false,
      },
    });

    res.status(201).json({
      message: "Doctor registered successfully, pending admin approval",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ تسجيل الدخول
 */
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { email } });
    if (!doctor)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!doctor.isVerified)
      return res
        .status(403)
        .json({ message: "Your account is not verified yet." });

    const token = jwt.sign({ id: doctor.id, role: "doctor" }, SECRET_KEY, {
      expiresIn: "2h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ استرجاع بيانات الدكتور
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        specialty: true,
        title: true,
        phone: true,
        email: true,
        avatar: true,
        workingHours: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ تعديل بيانات الطبيب (يشمل تعديل الصورة ومواعيد العمل)
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const { name, specialty, title, workingHours } = req.body;

    let avatarUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      avatarUrl = result.secure_url;
    }

    const doctor = await prisma.doctor.update({
      where: { id: req.user.id },
      data: {
        name,
        specialty,
        title,
        avatar: avatarUrl,
        workingHours: JSON.parse(workingHours),
      },
    });

    res.json({ message: "Profile updated successfully", doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ نسيان كلمة المرور (إرسال رابط إعادة تعيين كلمة المرور)
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { email } });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const resetToken = jwt.sign({ id: doctor.id }, SECRET_KEY, {
      expiresIn: "15m",
    });

    await sendEmail(
      email,
      "Reset Your Password",
      `Click this link to reset your password: http://localhost:3000/reset-password/${resetToken}`
    );

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ إعادة تعيين كلمة المرور
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, SECRET_KEY);
    const doctor = await prisma.doctor.findUnique({
      where: { id: decoded.id },
    });

    if (!doctor) return res.status(400).json({ message: "Invalid token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ التحقق من الدكتور (خاص بالأدمن)
 */
export const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isVerified: true },
    });

    await sendEmail(
      doctor.email,
      "Account Verified",
      "Your account has been successfully verified."
    );

    res.json({ message: "Doctor verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadDocuments = async (req, res) => {
  try {
    const doctorId = req.user.id; // ⬅️ احصل على ID الطبيب من التوكن
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    const uploadedDocs = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.path);
        return result.secure_url; // ⬅️ احفظ رابط الوثيقة
      })
    );

    await prisma.doctor.update({
      where: { id: doctorId },
      data: { documents: uploadedDocs },
    });

    res.json({
      message: "Documents uploaded successfully",
      documents: uploadedDocs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
