import express from "express";
import pool from "../config/database";
import { notifyInventoryOperation } from "../utils/notificationHelper";

const router = express.Router();

// Get all inventory records
router.get("/", async (req, res) => {
  try {
    const { medicine_id, type, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT ir.*, 
             m.name as medicine_name, m.price as medicine_price,
             u.name as user_name
      FROM inventory_records ir
      JOIN medicines m ON ir.medicine_id = m.id
      JOIN users u ON ir.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (medicine_id) {
      query += " AND ir.medicine_id = ?";
      params.push(medicine_id);
    }

    if (type) {
      query += " AND ir.type = ?";
      params.push(type);
    }

    query += " ORDER BY ir.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM inventory_records WHERE 1=1";
    const countParams: any[] = [];
    if (medicine_id) {
      countQuery += " AND medicine_id = ?";
      countParams.push(medicine_id);
    }
    if (type) {
      countQuery += " AND type = ?";
      countParams.push(type);
    }
    const [countRows]: any = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      data: rows,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error fetching inventory records:", error);
    res.status(500).json({ error: "Failed to fetch inventory records" });
  }
});

// Create inventory record (import/export)
router.post("/", async (req, res) => {
  try {
    const { medicine_id, type, quantity, user_id, notes } = req.body;

    if (!["import", "export"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'import' or 'export'" });
    }

    const id = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await pool.execute(
      `INSERT INTO inventory_records (id, medicine_id, type, quantity, user_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, medicine_id, type, quantity, user_id, notes || null]
    );

    // Note: Stock update is handled by the tr_inventory_update_stock trigger
    // No manual update needed here to avoid duplicate updates

    const [rows]: any = await pool.execute(
      `SELECT ir.*, 
              m.name as medicine_name, m.price as medicine_price,
              u.name as user_name
       FROM inventory_records ir
       JOIN medicines m ON ir.medicine_id = m.id
       JOIN users u ON ir.user_id = u.id
       WHERE ir.id = ?`,
      [id]
    );

    const inventoryRecord = rows[0];

    // Send notification to all admin and inventory_staff users
    if (inventoryRecord) {
      notifyInventoryOperation(
        type as 'import' | 'export',
        inventoryRecord.medicine_name,
        quantity,
        user_id,
        inventoryRecord.user_name,
        notes || null
      ).catch((error) => {
        // Log error but don't fail the request
        console.error("Failed to send inventory notification:", error);
      });
    }

    res.status(201).json(inventoryRecord);
  } catch (error) {
    console.error("Error creating inventory record:", error);
    res.status(500).json({ error: "Failed to create inventory record" });
  }
});

export default router;
