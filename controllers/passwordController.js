import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";
import { sendSMS } from "../utils/smsService.js";

const prisma = new PrismaClient();

// ✅ طلب استعادة كلمة المرور (يرسل إيميل أو SMS)
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 3600000) },
    });

    if (user.email) {
      await sendEmail(
        user.email,
        "Reset Your Password",
        `Your reset token: ${resetToken}`
      );
    } else if (user.phone) {
      await sendSMS(user.phone, `Your reset code is: ${resetToken}`);
    }

    res.json({ message: "Password reset instructions sent." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ إعادة تعيين كلمة المرور
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const user = await prisma.user.findFirst({ where: { resetToken } });

    if (!user || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ التحقق من OTP لاستعادة كلمة المرور
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    const user = await prisma.user.findFirst({ where: { phone, otpCode } });

    if (!user || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null },
    });

    res.json({ message: "OTP verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
