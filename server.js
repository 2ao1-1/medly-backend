import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import setupSwagger from "./swagger.js"; // استيراد Swagger
import cors from "cors";

dotenv.config();

// const app = express();
const prisma = new PrismaClient();
// const express = require("express");
// const cors = require("cors");

const app = express();

// تفعيل CORS للسماح للفرونت إند بالاتصال
app.use(
  cors({
    origin: "http://localhost:5173", // استبدل بـ URL الواجهة الأمامية عند نشر التطبيق
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

setupSwagger(app);

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication (Register, Login, Verify)
 */

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // إذا لم يكن هناك header للتوثيق، أرجع خطأ
  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication token required",
      details:
        "Please include a valid Bearer token in the Authorization header",
    });
  }

  // تقسيم الهيدر للتأكد من صحة التنسيق
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Invalid token format",
      details: "Token must be in the format: Bearer [token]",
    });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
      details: err.message,
    });
  }
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user or doctor
 *     description: Creates a new user account. If role is 'doctor', additional fields are required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: "patient"
 *               name:
 *                 type: string
 *                 example: "Admin"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: Successfully registered.
 *       400:
 *         description: Invalid input data.
 *       409:
 *         description: User already exists.
 *       500:
 *         description: Server error.
 */
app.post("/register", async (req, res) => {
  const {
    name,
    phone,
    email,
    password,
    role,
    specialty,
    workingHours,
    certificates,
  } = req.body;

  // Enhanced input validation
  if (!email || !password) {
    return res.status(400).json({
      error: "Missing required fields",
      details: "Name, phone, email, and password are mandatory",
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid email format",
      details: "Please provide a valid email address",
    });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({
      error: "Weak password",
      details: "Password must be at least 8 characters long",
    });
  }

  if (!["patient", "doctor"].includes(role)) {
    return res.status(400).json({
      error: "Invalid role",
      details: "Role must be either 'patient' or 'doctor'",
    });
  }

  try {
    let existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        details: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role: role === "patient" ? "patient" : "doctor",
      },
    });

    // if (role === "doctor") {
    //   if (!specialty || !workingHours) {
    //     return res.status(400).json({
    //       error: "Incomplete doctor profile",
    //       details:
    //         "Specialty, working hours, and certificates are required for doctors",
    //     });
    //   }
    //   await prisma.doctor.create({
    //     data: {
    //       userId: user.id,
    //       specialty,
    //       workingHours,
    //     },
    //   });
    // }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({
      error: "Registration failed",
      details: err.message,
    });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
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
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      error: "Missing credentials",
      details: "Email and password are required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      // include: { doctor: role === "doctor" ? true : false },
    });

    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({
      error: "Login failed",
      details: err.message,
    });
  }
});

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     description: Retrieves a list of all available doctors.
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of doctors.
 *       500:
 *         description: Server error.
 */
app.get("/doctors", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({ include: { user: true } });
    res.json(doctors);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching doctors", details: err.message });
  }
});

/**
 * @swagger
 * /doctor/{id}:
 *   put:
 *     summary: Update doctor details
 *     description: Allows a doctor to update their profile information.
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialty:
 *                 type: string
 *               workingHours:
 *                 type: string
 *               certificates:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated.
 *       404:
 *         description: Doctor not found.
 *       500:
 *         description: Server error.
 */
app.put("/doctor/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, specialty, workingHours, certificates } = req.body;

  try {
    let doctor = await prisma.doctor.findUnique({ where: { userId: id } });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    let updateData = {};
    if (specialty) updateData.specialty = specialty;
    if (workingHours) updateData.workingHours = workingHours;
    if (certificates) updateData.certificates = certificates;

    const updatedDoctor = await prisma.doctor.update({
      where: { userId: id },
      data: updateData,
    });

    if (name || phone) {
      await prisma.user.update({ where: { id }, data: { name, phone } });
    }

    res.json({ message: "Doctor updated successfully", updatedDoctor });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating doctor", details: err.message });
  }
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve user details by ID
 *     description: Fetch user information based on the provided ID. If the user is a doctor, their additional doctor-related details will be included.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User details successfully retrieved
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error occurred while retrieving the user details
 */
app.get("/user/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { doctor: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error retrieving user", details: err.message });
  }
});

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user details
 *     description: Allows users to update their profile information such as name, phone, email, and password.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Successfully updated the user profile.
 *       400:
 *         description: Invalid input data.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error occurred while updating user details.
 */
app.put("/user/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json({ message: "User updated successfully", updatedUser });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating user", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
