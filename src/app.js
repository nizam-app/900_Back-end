/** @format */

// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import { detectLanguage, addTranslationHelpers } from "./middleware/language.js";

import authRoutes from "./routes/auth.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import srRoutes from "./routes/sr.routes.js";
import woRoutes from "./routes/wo.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import commissionRoutes from "./routes/commission.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportRoutes from "./routes/report.routes.js";
import locationRoutes from "./routes/location.routes.js";
import callCenterRoutes from "./routes/callcenter.routes.js";
import dispatcherRoutes from "./routes/dispatcher.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import smsRoutes from "./routes/sms.routes.js";
import technicianRoutes from "./routes/technician.routes.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://outside1backend.mtscorporate.com",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, restrict later
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));

// JSON (for normal APIs)
app.use(express.json());
// URL-encoded (optional, for form posts without files)
app.use(express.urlencoded({ extended: true }));

// Language detection middleware (before routes)
app.use(detectLanguage);
app.use(addTranslationHelpers);

// Serve static files (uploads)
app.use("/uploads", express.static("uploads"));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/sr", srRoutes);
app.use("/api/wos", woRoutes); // Changed from /api/wo to /api/wos
app.use("/api/payments", paymentRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/callcenter", callCenterRoutes);
app.use("/api/dispatcher", dispatcherRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/technician", technicianRoutes);

app.get("/", (req, res) => {
  res.json({ status: "FSM backend running ok" });
});

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API status check
app.get("/api/status", (req, res) => {
  res.json({
    message: "API is working",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      workOrders: "/api/wo",
      serviceRequests: "/api/sr",
      categories: "/api/categories",
      admin: "/api/admin",
    },
  });
});

app.use(errorHandler);

export default app;
