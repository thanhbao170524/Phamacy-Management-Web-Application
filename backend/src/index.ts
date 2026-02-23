// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import medicinesRoutes from "./routes/medicines.js";
import categoriesRoutes from "./routes/categories.js";
import inventoryRoutes from "./routes/inventory.js";
import salesRoutes from "./routes/sales.js";
import staffRoutes from "./routes/staff.js";
import membersRoutes from "./routes/members.js";
import alertsRoutes from "./routes/alerts.js";
import settingsRoutes from "./routes/settings.js";
import reportsRoutes from "./routes/reports.js";
import notificationsRoutes from "./routes/notifications.js";
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicinesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Root route - API info
app.get("/", (req, res) => {
  res.json({
    name: "PharmaT API",
    version: "1.0.0",
    status: "running",
      endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      medicines: "/api/medicines",
      categories: "/api/categories",
      inventory: "/api/inventory",
      sales: "/api/sales",
      staff: "/api/staff",
      members: "/api/members",
      alerts: "/api/alerts",
      settings: "/api/settings",
      reports: "/api/reports",
      notifications: "/api/notifications",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PharmaT API is running" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
