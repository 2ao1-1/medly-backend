import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";
import { sendSMS } from "../utils/smsService.js";
import crypto from "crypto";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

// ✅ تسجيل مستخدم جديد
export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phone }, { email }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Phone or email already registered" });
    }

    const saltRounds = 12;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
      },
    });

    if (email) {
      await sendEmail(
        email,
        "Verify Your Account",
        `Your verification code is: ${verificationCode}`
      );
    } else if (phone) {
      await sendSMS(phone, `Your verification code is: ${verificationCode}`);
    }

    res.status(201).json({
      message: "User registered successfully. Verification code sent.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ تسجيل الدخول
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid email or phone number" });
    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your account first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, role: "user" }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ تأكيد الحساب
export const verifyUser = async (req, res) => {
  try {
    const { identifier, code } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.verificationCode !== Number(code)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationCode: null },
    });

    res.json({ message: "Account verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
