export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-secret-key",
  EXPIRES_IN: "24h",
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
};
