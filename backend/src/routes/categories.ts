import express from "express";
import pool from "../config/database";
import { authenticateToken, requireRole } from "../middleware/auth";
import { ValidationError, NotFoundError, AppError } from "../utils/errors";
import { handleDatabaseError } from "../utils/dbErrorHandler";
import { logger } from "../utils/logger";

const router = express.Router();

// Get all categories with medicine count (protected, admin/inventory staff only)
router.get("/", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { search, sort = "name", order = "asc" } = req.query;
    
    // Build WHERE clause
    let whereClause = "";
    const params: any[] = [];
    
    if (search) {
      whereClause = "WHERE mc.name LIKE ?";
      params.push(`%${search}%`);
    }

    // Build ORDER BY clause
    let orderBy = "ORDER BY ";
    const validSortFields: Record<string, string> = {
      name: "mc.name",
      count: "medicine_count",
      created: "mc.created_at"
    };
    const sortField = validSortFields[sort as string] || "mc.name";
    const sortOrder = (order as string).toLowerCase() === "desc" ? "DESC" : "ASC";
    orderBy += `${sortField} ${sortOrder}`;

    // Query with medicine count
    const query = `
      SELECT 
        mc.id,
        mc.name,
        mc.description,
        mc.created_at,
        COUNT(m.id) as medicine_count
      FROM medicine_categories mc
      LEFT JOIN medicines m ON mc.id = m.category_id
      ${whereClause}
      GROUP BY mc.id, mc.name, mc.description, mc.created_at
      ${orderBy}
    `;

    const [rows]: any = await pool.execute(query, params);

    const duration = Date.now() - startTime;
    logger.request('GET', '/categories', (req as any).user?.id, duration);

    res.json({
      data: rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || null,
        createdAt: row.created_at,
        medicineCount: parseInt(row.medicine_count) || 0
      })),
      total: rows.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get category by ID (protected, admin/inventory staff only)
router.get("/:id", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    const query = `
      SELECT 
        mc.id,
        mc.name,
        mc.description,
        mc.created_at,
        COUNT(m.id) as medicine_count
      FROM medicine_categories mc
      LEFT JOIN medicines m ON mc.id = m.category_id
      WHERE mc.id = ?
      GROUP BY mc.id, mc.name, mc.description, mc.created_at
    `;
    
    const [rows]: any = await pool.execute(query, [req.params.id]);

    if (rows.length === 0) {
      throw new NotFoundError('Category', req.params.id);
    }

    const duration = Date.now() - startTime;
    logger.request('GET', `/categories/${req.params.id}`, (req as any).user?.id, duration);

    res.json({
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description || null,
      createdAt: rows[0].created_at,
      medicineCount: parseInt(rows[0].medicine_count) || 0
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get medicines by category ID (protected, admin/inventory staff only)
router.get("/:id/medicines", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    // Check if category exists
    const [categoryRows]: any = await pool.execute(
      "SELECT id, name FROM medicine_categories WHERE id = ?",
      [req.params.id]
    );

    if (categoryRows.length === 0) {
      throw new NotFoundError('Category', req.params.id);
    }

    // Get medicines in this category
    const [medicineRows]: any = await pool.execute(
      "SELECT * FROM medicines WHERE category_id = ? ORDER BY name",
      [req.params.id]
    );

    const duration = Date.now() - startTime;
    logger.request('GET', `/categories/${req.params.id}/medicines`, (req as any).user?.id, duration);

    res.json({
      category: {
        id: categoryRows[0].id,
        name: categoryRows[0].name
      },
      medicines: medicineRows,
      total: medicineRows.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Create category (protected, admin/inventory staff only)
router.post("/", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new ValidationError("Tên danh mục không được để trống");
    }

    const trimmedName = name.trim();

    // Check if name already exists
    const [existingRows]: any = await pool.execute(
      "SELECT id FROM medicine_categories WHERE name = ?",
      [trimmedName]
    );

    if (existingRows.length > 0) {
      throw new ValidationError("Tên danh mục đã tồn tại trong hệ thống");
    }

    // Insert new category
    await pool.execute(
      "INSERT INTO medicine_categories (name, description) VALUES (?, ?)",
      [trimmedName, description && description.trim() ? description.trim() : null]
    );

    // Get the created category
    const [rows]: any = await pool.execute(
      "SELECT id, name, description, created_at FROM medicine_categories WHERE name = ?",
      [trimmedName]
    );

    const duration = Date.now() - startTime;
    logger.request('POST', '/categories', (req as any).user?.id, duration);
    logger.info('Category created', { categoryId: rows[0].id, name: trimmedName, userId: (req as any).user?.id });

    res.status(201).json({
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description || null,
      createdAt: rows[0].created_at,
      medicineCount: 0
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Update category (protected, admin/inventory staff only)
router.put("/:id", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { name, description } = req.body;
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      throw new ValidationError("ID danh mục không hợp lệ");
    }

    // Check if category exists
    const [existingRows]: any = await pool.execute(
      "SELECT id, name FROM medicine_categories WHERE id = ?",
      [categoryId]
    );

    if (existingRows.length === 0) {
      throw new NotFoundError('Category', req.params.id);
    }

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new ValidationError("Tên danh mục không được để trống");
    }

    const trimmedName = name.trim();

    // Check if name already exists (excluding current category)
    const [duplicateRows]: any = await pool.execute(
      "SELECT id FROM medicine_categories WHERE name = ? AND id != ?",
      [trimmedName, categoryId]
    );

    if (duplicateRows.length > 0) {
      throw new ValidationError("Tên danh mục đã tồn tại trong hệ thống");
    }

    // Update category
    await pool.execute(
      "UPDATE medicine_categories SET name = ?, description = ? WHERE id = ?",
      [trimmedName, description && description.trim() ? description.trim() : null, categoryId]
    );

    // Get updated category with count
    const [rows]: any = await pool.execute(
      `SELECT 
        mc.id,
        mc.name,
        mc.description,
        mc.created_at,
        COUNT(m.id) as medicine_count
      FROM medicine_categories mc
      LEFT JOIN medicines m ON mc.id = m.category_id
      WHERE mc.id = ?
      GROUP BY mc.id, mc.name, mc.description, mc.created_at`,
      [categoryId]
    );

    const duration = Date.now() - startTime;
    logger.request('PUT', `/categories/${categoryId}`, (req as any).user?.id, duration);
    logger.info('Category updated', { categoryId, name: trimmedName, userId: (req as any).user?.id });

    res.json({
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description || null,
      createdAt: rows[0].created_at,
      medicineCount: parseInt(rows[0].medicine_count) || 0
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Delete category (protected, admin/inventory staff only)
router.delete("/:id", authenticateToken, requireRole("admin", "inventory_staff"), async (req, res, next) => {
  const startTime = Date.now();
  try {
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      throw new ValidationError("ID danh mục không hợp lệ");
    }

    // Check if category exists
    const [categoryRows]: any = await pool.execute(
      "SELECT id, name FROM medicine_categories WHERE id = ?",
      [categoryId]
    );

    if (categoryRows.length === 0) {
      throw new NotFoundError('Category', req.params.id);
    }

    // Check if category has medicines
    const [medicineRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM medicines WHERE category_id = ?",
      [categoryId]
    );

    const medicineCount = parseInt(medicineRows[0].count) || 0;

    if (medicineCount > 0) {
      throw new ValidationError(
        `Không thể xóa danh mục này vì còn ${medicineCount} thuốc đang thuộc danh mục. Vui lòng chuyển các thuốc sang danh mục khác trước khi xóa.`
      );
    }

    // Delete category
    const [result]: any = await pool.execute(
      "DELETE FROM medicine_categories WHERE id = ?",
      [categoryId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundError('Category', req.params.id);
    }

    logger.info('Category deleted', { categoryId, name: categoryRows[0].name, userId: (req as any).user?.id });

    res.json({ 
      message: "Danh mục đã được xóa thành công",
      deletedCategory: {
        id: categoryRows[0].id,
        name: categoryRows[0].name
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

export default router;
