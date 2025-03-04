import { body, validationResult } from "express-validator";

export const validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
