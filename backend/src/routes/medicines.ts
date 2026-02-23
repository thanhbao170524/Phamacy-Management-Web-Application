import express from "express";
import pool from "../config/database";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateMedicine } from "../utils/validator";
import { NotFoundError, AppError } from "../utils/errors";
import { handleDatabaseError } from "../utils/dbErrorHandler";
import { logger } from "../utils/logger";

const router = express.Router();

// Get categories
router.get("/categories", async (req, res, next) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT * FROM medicine_categories ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Mock data as fallback
const medicines = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    description: "Thuốc giảm đau, hạ sốt",
    category: "Giảm đau",
    price: 15000,
    quantity: 150,
    expiryDate: "2025-12-31",
    stockAlert: 20,
    barcode: "8936017180001",
    manufacturer: "Công ty ABC",
  },
  {
    id: "2",
    name: "Amoxicillin 500mg",
    description: "Kháng sinh",
    category: "Kháng sinh",
    price: 45000,
    quantity: 5,
    expiryDate: "2024-12-15",
    stockAlert: 30,
    barcode: "8936017180002",
    manufacturer: "Công ty XYZ",
  },
  {
    id: "3",
    name: "Vitamin C 1000mg",
    description: "Bổ sung vitamin C",
    category: "Vitamin",
    price: 25000,
    quantity: 200,
    expiryDate: "2025-06-30",
    stockAlert: 50,
    barcode: "8936017180003",
    manufacturer: "Công ty DEF",
  },
];

// Get all medicines (protected - all authenticated users can view, but only admin/inventory can edit)
router.get("/", authenticateToken, async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT m.*, mc.name as category_name 
      FROM medicines m 
      JOIN medicine_categories mc ON m.category_id = mc.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += " AND m.name LIKE ?";
      params.push(`%${search}%`);
    }

    if (category) {
      query += " AND mc.name = ?";
      params.push(category);
    }

    query += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM medicines m 
      JOIN medicine_categories mc ON m.category_id = mc.id 
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += " AND m.name LIKE ?";
      countParams.push(`%${search}%`);
    }

    if (category) {
      countQuery += " AND mc.name = ?";
      countParams.push(category);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    const duration = Date.now() - startTime;
    logger.request('GET', '/medicines', (req as any).user?.id, duration);

    res.json({
      data: rows,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get medicine by ID (protected - all authenticated users can view)
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT m.*, mc.name as category_name FROM medicines m JOIN medicine_categories mc ON m.category_id = mc.id WHERE m.id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Medicine', req.params.id);
    }

    res.json(rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Create medicine (protected, admin/inventory staff only)
router.post("/", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    // Validate input
    const validatedData = validateMedicine(req.body);
    
    const id = `M${Date.now()}`;

    // Convert empty string to NULL for barcode
    const barcodeValue = validatedData.barcode && validatedData.barcode.trim() !== "" 
      ? validatedData.barcode 
      : null;

    await pool.execute(
      "INSERT INTO medicines (id, name, description, category_id, price, quantity, expiry_date, stock_alert, barcode, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        validatedData.name,
        validatedData.description,
        validatedData.category_id,
        validatedData.price,
        validatedData.quantity,
        validatedData.expiry_date,
        validatedData.stock_alert,
        barcodeValue,
        validatedData.manufacturer,
      ]
    );

    const [rows]: any = await pool.execute(
      "SELECT m.*, mc.name as category_name FROM medicines m JOIN medicine_categories mc ON m.category_id = mc.id WHERE m.id = ?",
      [id]
    );

    const duration = Date.now() - startTime;
    logger.request('POST', '/medicines', (req as any).user?.id, duration);
    logger.info('Medicine created', { medicineId: id, name: validatedData.name, userId: (req as any).user?.id });

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Update medicine (protected, admin/inventory staff only)
router.put("/:id", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    // Validate input
    const validatedData = validateMedicine(req.body);

    const barcodeValue = validatedData.barcode && validatedData.barcode.trim() !== "" 
      ? validatedData.barcode 
      : null;

    await pool.execute(
      "UPDATE medicines SET name = ?, description = ?, category_id = ?, price = ?, quantity = ?, expiry_date = ?, stock_alert = ?, barcode = ?, manufacturer = ? WHERE id = ?",
      [
        validatedData.name,
        validatedData.description,
        validatedData.category_id,
        validatedData.price,
        validatedData.quantity,
        validatedData.expiry_date,
        validatedData.stock_alert,
        barcodeValue,
        validatedData.manufacturer,
        req.params.id,
      ]
    );

    const [rows]: any = await pool.execute(
      "SELECT m.*, mc.name as category_name FROM medicines m JOIN medicine_categories mc ON m.category_id = mc.id WHERE m.id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Medicine', req.params.id);
    }

    const duration = Date.now() - startTime;
    logger.request('PUT', `/medicines/${req.params.id}`, (req as any).user?.id, duration);
    logger.info('Medicine updated', { medicineId: req.params.id, userId: (req as any).user?.id });

    res.json(rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Delete medicine (protected, admin/inventory staff only)
router.delete("/:id", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  try {
    const [result]: any = await pool.execute(
      "DELETE FROM medicines WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundError('Medicine', req.params.id);
    }

    logger.info('Medicine deleted', { medicineId: req.params.id, userId: (req as any).user?.id });

    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

export default router;
