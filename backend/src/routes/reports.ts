import express from "express";
import pool from "../config/database";
import { authenticateToken, requireRole } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { handleDatabaseError } from "../utils/dbErrorHandler";
import { logger } from "../utils/logger";

const router = express.Router();

// Get monthly revenue
router.get("/monthly-revenue", authenticateToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    const [rows]: any = await pool.execute(
      `SELECT 
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers
       FROM orders 
       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status = 'completed'`,
      [targetMonth, targetYear]
    );

    res.json(rows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get daily sales for current month
router.get("/daily-sales", authenticateToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    const [rows]: any = await pool.execute(
      `SELECT 
        DAY(created_at) as day,
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as orders
       FROM orders 
       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status = 'completed'
       GROUP BY DAY(created_at)
       ORDER BY day`,
      [targetMonth, targetYear]
    );

    res.json(rows);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get category sales
router.get("/category-sales", authenticateToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    const [rows]: any = await pool.execute(
      `SELECT 
        mc.name as category_name,
        COALESCE(SUM(oi.subtotal), 0) as revenue,
        SUM(oi.quantity) as quantity
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       JOIN medicine_categories mc ON m.category_id = mc.id
       JOIN orders o ON oi.order_id = o.id
       WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.status = 'completed'
       GROUP BY mc.id, mc.name
       ORDER BY revenue DESC`,
      [targetMonth, targetYear]
    );

    res.json(rows);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get top selling products (all time or by month/year)
router.get("/top-products", authenticateToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { month, year, limit = 10, all_time = false } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    let query, params;
    
    if (all_time === 'true' || all_time === true) {
      // Get top products all time
      query = `SELECT 
        m.id,
        m.name,
        mc.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        COALESCE(SUM(oi.subtotal), 0) as revenue
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       JOIN medicine_categories mc ON m.category_id = mc.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       GROUP BY m.id, m.name, mc.name
       ORDER BY revenue DESC
       LIMIT ?`;
      params = [Number(limit)];
    } else {
      // Get top products by month/year
      query = `SELECT 
        m.id,
        m.name,
        mc.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        COALESCE(SUM(oi.subtotal), 0) as revenue
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       JOIN medicine_categories mc ON m.category_id = mc.id
       JOIN orders o ON oi.order_id = o.id
       WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.status = 'completed'
       GROUP BY m.id, m.name, mc.name
       ORDER BY revenue DESC
       LIMIT ?`;
      params = [targetMonth, targetYear, Number(limit)];
    }

    const [rows]: any = await pool.execute(query, params);

    // Calculate total revenue for percentage
    let totalQuery, totalParams;
    if (all_time === 'true' || all_time === true) {
      totalQuery = `SELECT COALESCE(SUM(oi.subtotal), 0) as total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'`;
      totalParams = [];
    } else {
      totalQuery = `SELECT COALESCE(SUM(oi.subtotal), 0) as total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.status = 'completed'`;
      totalParams = [targetMonth, targetYear];
    }

    const [totalRevenue]: any = await pool.execute(totalQuery, totalParams);

    const total = totalRevenue[0].total || 1;
    const products = rows.map((item: any) => ({
      ...item,
      percentage: total > 0 ? ((item.revenue / total) * 100).toFixed(1) : 0,
    }));

    res.json(products);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get comprehensive report
router.get("/comprehensive", authenticateToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    // Monthly revenue
    const [monthlyStats]: any = await pool.execute(
      `SELECT 
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers,
        AVG(final_amount) as average_order
       FROM orders 
       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status = 'completed'`,
      [targetMonth, targetYear]
    );

    // Items sold
    const [itemsStats]: any = await pool.execute(
      `SELECT SUM(oi.quantity) as items_sold
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.status = 'completed'`,
      [targetMonth, targetYear]
    );

    // Top category
    const [topCategory]: any = await pool.execute(
      `SELECT mc.name as category_name
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       JOIN medicine_categories mc ON m.category_id = mc.id
       JOIN orders o ON oi.order_id = o.id
       WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.status = 'completed'
       GROUP BY mc.id, mc.name
       ORDER BY SUM(oi.subtotal) DESC
       LIMIT 1`,
      [targetMonth, targetYear]
    );

    // New customers
    const [newCustomers]: any = await pool.execute(
      `SELECT COUNT(*) as count
       FROM members
       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
      [targetMonth, targetYear]
    );

    res.json({
      monthlyRevenue: parseFloat(monthlyStats[0].revenue) || 0,
      totalOrders: parseInt(monthlyStats[0].orders) || 0,
      averageOrder: parseFloat(monthlyStats[0].average_order) || 0,
      itemsSold: parseInt(itemsStats[0].items_sold) || 0,
      topCategory: topCategory[0]?.category_name || "N/A",
      newCustomers: parseInt(newCustomers[0].count) || 0,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

export default router;

