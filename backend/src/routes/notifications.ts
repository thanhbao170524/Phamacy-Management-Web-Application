import express from "express";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { NotFoundError, AppError } from "../utils/errors";
import { handleDatabaseError } from "../utils/dbErrorHandler";
import { logger } from "../utils/logger";

const router = express.Router();

// Get all notifications for current user (includes alerts)
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { is_read, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get user role to determine if they should see alerts
    const [userRows]: any = await pool.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );
    const userRole = userRows[0]?.role;

    // Fetch user-specific notifications
    let query = "SELECT * FROM notifications WHERE user_id = ?";
    const params: any[] = [userId];

    if (is_read !== undefined) {
      query += " AND is_read = ?";
      params.push(is_read === "true" ? 1 : 0);
    }

    const [notifRows]: any = await pool.execute(query, params);

    // Fetch unread alerts (system-wide, visible to all users)
    let alertsQuery = "SELECT * FROM alerts WHERE is_read = 0";
    const alertsParams: any[] = [];

    if (is_read !== undefined && is_read === "true") {
      alertsQuery = "SELECT * FROM alerts WHERE is_read = 1";
    }

    alertsQuery += " ORDER BY created_at DESC";
    const [alertRows]: any = await pool.execute(alertsQuery, alertsParams);

    // Combine notifications and alerts
    const combined: any[] = [
      // User notifications
      ...notifRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        is_read: row.is_read === 1 || row.is_read === true,
        created_at: row.created_at,
        type: "notification",
      })),
      // System alerts (convert to notification format)
      ...alertRows.map((row: any) => ({
        id: `alert-${row.id}`, // Prefix to avoid conflicts
        title: row.title,
        message: row.message,
        is_read: row.is_read === 1 || row.is_read === true,
        created_at: row.created_at,
        type: "alert",
        alert_id: row.id, // Keep original alert ID
        severity: row.severity,
      })),
    ];

    // Sort by created_at DESC
    combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const paginated = combined.slice(offset, offset + Number(limit));

    res.json({
      data: paginated,
      total: combined.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

// Get unread notifications count (includes alerts)
router.get("/unread/count", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Count user notifications
    const [notifRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );
    const notificationCount = notifRows[0].count || 0;

    // Count unread alerts (system-wide)
    const [alertRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM alerts WHERE is_read = 0"
    );
    const alertCount = alertRows[0].count || 0;

    res.json({ count: notificationCount + alertCount });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

// Mark notification as read (handles both notifications and alerts)
router.put("/:id/read", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const notificationId = req.params.id;

    // Check if it's an alert (prefixed with "alert-")
    if (notificationId.startsWith("alert-")) {
      const alertId = notificationId.replace("alert-", "");
      // Mark alert as read
      await pool.execute("UPDATE alerts SET is_read = 1 WHERE id = ?", [alertId]);
      res.json({ message: "Alert marked as read" });
    } else {
      // Mark user notification as read
      const [existing]: any = await pool.execute(
        "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
        [notificationId, userId]
      );

      if (existing.length === 0) {
        throw new NotFoundError("Notification", notificationId);
      }

      await pool.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [notificationId]);
      res.json({ message: "Notification marked as read" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

// Mark all notifications as read (includes alerts)
router.put("/read-all", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Mark all user notifications as read
    await pool.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [userId]);
    
    // Mark all unread alerts as read
    await pool.execute("UPDATE alerts SET is_read = 1 WHERE is_read = 0");

    logger.info("All notifications and alerts marked as read", { userId });

    res.json({ message: "All notifications and alerts marked as read" });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

// Create notification (admin only - for system notifications)
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const { user_id, title, message } = req.body;

    if (!user_id || !title) {
      throw new AppError("user_id and title are required", 400);
    }

    const id = `N${Date.now()}`;

    await pool.execute(
      "INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)",
      [id, user_id, title, message || null]
    );

    const [rows]: any = await pool.execute("SELECT * FROM notifications WHERE id = ?", [id]);

    logger.info("Notification created", { notificationId: id, userId: user_id });

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const [existing]: any = await pool.execute(
      "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
      [req.params.id, userId]
    );

    if (existing.length === 0) {
      throw new NotFoundError("Notification", req.params.id);
    }

    await pool.execute("DELETE FROM notifications WHERE id = ?", [req.params.id]);

    logger.info("Notification deleted", { notificationId: req.params.id, userId });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(error);
  }
});

export default router;

