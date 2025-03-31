import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ تفعيل حماية الـ Headers ضد XSS و CSRF
app.use(helmet());

// ✅ تقييد عدد الطلبات لتجنب الهجمات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ⬅️ 15 دقيقة
  max: 100, // ⬅️ كل IP يمكنه تنفيذ 100 طلب فقط
  message: "Too many requests, please try again later.",
});

app.use(limiter);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Medical Platform API",
      version: "1.0.0",
      description: "API Documentation for Medical Platform Services",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["server.js"],
};
const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

// Swagger Configuration
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
export default setupSwagger;
