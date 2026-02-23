import express from "express";
import pool from "../config/database";

const router = express.Router();

// Get all alerts
router.get("/", async (req, res) => {
  try {
    const { type, severity, is_read, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = "SELECT * FROM alerts WHERE 1=1";
    const params: any[] = [];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    if (is_read !== undefined) {
      query += " AND is_read = ?";
      params.push(is_read === "true" ? 1 : 0);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Transform to frontend format
    const alerts = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      severity: row.severity,
      date: row.created_at,
      read: row.is_read === 1 || row.is_read === true,
    }));

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM alerts WHERE 1=1";
    const countParams: any[] = [];
    if (type) {
      countQuery += " AND type = ?";
      countParams.push(type);
    }
    if (severity) {
      countQuery += " AND severity = ?";
      countParams.push(severity);
    }
    if (is_read !== undefined) {
      countQuery += " AND is_read = ?";
      countParams.push(is_read === "true" ? 1 : 0);
    }
    const [countRows]: any = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      data: alerts,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts", details: error instanceof Error ? error.message : String(error) });
  }
});

// Mark alert as read
router.put("/:id/read", async (req, res) => {
  try {
    await pool.execute("UPDATE alerts SET is_read = 1 WHERE id = ?", [
      req.params.id,
    ]);

    const [rows]: any = await pool.execute("SELECT * FROM alerts WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const alert = rows[0];
    res.json({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      date: alert.created_at,
      read: true,
    });
  } catch (error) {
    console.error("Error marking alert as read:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// Delete alert
router.delete("/:id", async (req, res) => {
  try {
    const [result]: any = await pool.execute(
      "DELETE FROM alerts WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert deleted" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

// Get unread count
router.get("/unread/count", async (req, res) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM alerts WHERE is_read = 0"
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count", details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;

