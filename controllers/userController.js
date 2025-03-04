import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../utils/emailService.js";
import { sendSMS } from "../utils/smsService.js";
import cloudinary from "../utils/cloudinaryConfig.js";

const prisma = new PrismaClient();

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    let updateData = { name };

    // Handle avatar upload if file exists
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        updateData.avatar = result.secure_url;
      } catch (error) {
        return res.status(400).json({ message: "Error uploading image" });
      }
    }

    if (user.avatar) {
      await cloudinary.uploader.destroy(user.avatar); // ⬅️ حذف الصورة القديمة
    }
    const uploadResponse = await cloudinary.uploader.upload(req.file.path);
    const imageUrl = uploadResponse.secure_url; // ✅ استخدام `secure_url` للحماية

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Request contact change
export const requestChangeContact = async (req, res) => {
  try {
    const { newEmail, newPhone } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { verificationCode },
    });

    if (newEmail) {
      await sendEmail(
        newEmail,
        "Confirm Your New Email",
        `Your verification code is: ${verificationCode}`
      );
      return res.json({ message: "Verification code sent to new email" });
    }

    if (newPhone) {
      await sendSMS(newPhone, `Your verification code is: ${verificationCode}`);
      return res.json({ message: "Verification code sent to new phone" });
    }

    res.status(400).json({ message: "No new contact provided" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Confirm contact change
export const confirmChangeContact = async (req, res) => {
  try {
    const { newEmail, newPhone, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.verificationCode !== Number(code)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const updateData = { verificationCode: null };
    if (newEmail) updateData.email = newEmail;
    if (newPhone) updateData.phone = newPhone;

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    res.json({ message: "Contact information updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
