import express from "express";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { handleDatabaseError } from "../utils/dbErrorHandler";
import { notifyOrderCompleted, notifyOrderCancelled } from "../utils/notificationHelper";
import { logger } from "../utils/logger";
import { 
  calculateMemberDiscount, 
  calculatePointsToAdd, 
  getUpgradeLevel 
} from "../utils/memberHelper";

const router = express.Router();

// Get all orders
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    let query = `
      SELECT o.*, 
             m.name as customer_name, m.phone as customer_phone,
             u.name as staff_name
      FROM orders o
      LEFT JOIN members m ON o.customer_id = m.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Sales Staff chỉ xem được đơn hàng của chính mình
    if (userRole === 'sales_staff' && userId) {
      query += " AND o.staff_id = ?";
      params.push(userId);
    }

    if (date) {
      query += " AND DATE(o.created_at) = ?";
      params.push(date);
    }

    if (status) {
      query += " AND o.status = ?";
      params.push(status);
    }

    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Fix N+1 query problem: Get all order items in a single query
    if (rows.length > 0) {
      const orderIds = rows.map((order: any) => order.id);
      const placeholders = orderIds.map(() => '?').join(',');

      const [allItems]: any = await pool.execute(
        `SELECT oi.*, m.name as medicine_name
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id IN (${placeholders})`,
        orderIds
      );

      // Group items by order_id
      const itemsByOrder = allItems.reduce((acc: any, item: any) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {});

      // Assign items to each order
      rows.forEach((order: any) => {
        order.items = itemsByOrder[order.id] || [];
      });
    }

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM orders WHERE 1=1";
    const countParams: any[] = [];
    
    // Sales Staff chỉ đếm đơn hàng của chính mình
    if (userRole === 'sales_staff' && userId) {
      countQuery += " AND staff_id = ?";
      countParams.push(userId);
    }
    
    if (date) {
      countQuery += " AND DATE(created_at) = ?";
      countParams.push(date);
    }
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
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
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// Get today's stats
router.get("/stats/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [stats]: any = await pool.execute(
      `SELECT 
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers
       FROM orders 
       WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );
    res.json(stats[0]);
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get weekly sales (last 7 days)
router.get("/weekly", async (req, res, next) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Include today, so 7 days total

    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // Debug: Check all orders in the date range (any status)
    const [allOrdersDebug]: any = await pool.execute(
      `SELECT DATE(created_at) as date, status, COUNT(*) as count, SUM(final_amount) as total
       FROM orders 
       WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
       GROUP BY DATE(created_at), status
       ORDER BY date ASC, status`,
      [startDate, endDate]
    );
    console.log('📊 Debug: All orders in date range:', allOrdersDebug);

    // Get completed orders for revenue calculation
    // Sử dụng DATE_FORMAT để đảm bảo format date nhất quán
    const [rows]: any = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as orders
       FROM orders 
       WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    console.log('💰 Completed orders revenue:', JSON.stringify(rows, null, 2));
    console.log('📅 Date range:', { startDate, endDate });

    // Create a map of dates to revenue
    const salesMap = new Map();
    rows.forEach((row: any) => {
      // Đảm bảo date được format đúng
      const dateKey = row.date ? String(row.date).split('T')[0] : null;
      if (dateKey) {
        salesMap.set(dateKey, parseFloat(row.revenue) || 0);
        console.log(`📊 Mapping: ${dateKey} -> ${parseFloat(row.revenue) || 0}`);
      }
    });

    // Generate array for last 7 days with revenue
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[date.getDay()];
      
      // Tìm revenue từ map
      const revenue = salesMap.get(dateStr) || 0;
      const orderRow = rows.find((r: any) => {
        const rDate = r.date ? String(r.date).split('T')[0] : null;
        return rDate === dateStr;
      });
      const orders = orderRow ? (parseInt(orderRow.orders) || 0) : 0;
      
      console.log(`📈 Day ${dateStr} (${dayName}): revenue=${revenue}, orders=${orders}`);
      
      weeklySales.push({
        label: dayName,
        date: dateStr,
        value: revenue,
        orders: orders
      });
    }

    console.log('📦 Final weekly sales:', JSON.stringify(weeklySales, null, 2));
    res.json(weeklySales);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Get order by ID with full details
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [orderRows]: any = await pool.execute(
      `SELECT o.*, 
              m.name as customer_name, m.phone as customer_phone, m.email as customer_email,
              u.name as staff_name, u.email as staff_email
       FROM orders o
       LEFT JOIN members m ON o.customer_id = m.id
       LEFT JOIN users u ON o.staff_id = u.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const [orderItems]: any = await pool.execute(
      `SELECT oi.*, med.name as medicine_name, med.barcode
       FROM order_items oi 
       JOIN medicines med ON oi.medicine_id = med.id 
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [req.params.id]
    );

    orderRows[0].items = orderItems;

    res.json(orderRows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Create order (now creates as completed since payment is immediate)
router.post("/", authenticateToken, async (req, res, next) => {
  const startTime = Date.now();
  try {
    const {
      customer_id,
      staff_id,
      items,
      discount = 0,
    } = req.body;

    if (!items || items.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    const userId = (req as any).user?.id || staff_id;
    if (!userId) {
      throw new AppError("Staff ID is required", 400);
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.price;
    }

    // Calculate member discount if customer is a member
    let memberDiscount = discount;
    let memberLevel: string | null = null;
    if (customer_id) {
      const [memberRows]: any = await pool.execute(
        "SELECT level FROM members WHERE id = ?",
        [customer_id]
      );
      if (memberRows.length > 0) {
        memberLevel = memberRows[0].level;
        const autoDiscount = calculateMemberDiscount(memberLevel, totalAmount);
        // Use the higher discount (manual or auto)
        memberDiscount = Math.max(autoDiscount, discount || 0);
      }
    }

    const finalAmount = totalAmount - memberDiscount;

    const orderId = `ORD-${Date.now()}`;

    // Create order with status 'pending' (needs confirmation)
    await pool.execute(
      `INSERT INTO orders (id, customer_id, staff_id, total_amount, discount, final_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, customer_id || null, userId, totalAmount, memberDiscount, finalAmount]
    );

    // Create order items
    for (const item of items) {
      const itemId = `${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await pool.execute(
        `INSERT INTO order_items (id, order_id, medicine_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          orderId,
          item.medicine_id,
          item.quantity,
          item.price,
          item.quantity * item.price,
        ]
      );

      // Note: Stock update is handled by the tr_sale_update_stock trigger
      // No manual update or inventory_records creation needed to avoid duplicate updates
    }

    // Get created order with details
    const [orderRows]: any = await pool.execute(
      `SELECT o.*, 
              m.name as customer_name, m.phone as customer_phone,
              u.name as staff_name
       FROM orders o
       LEFT JOIN members m ON o.customer_id = m.id
       LEFT JOIN users u ON o.staff_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    const [orderItems]: any = await pool.execute(
      `SELECT oi.*, med.name as medicine_name 
       FROM order_items oi 
       JOIN medicines med ON oi.medicine_id = med.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );

    orderRows[0].items = orderItems;

    // Don't create notification when order is pending - will be created when completed

    const duration = Date.now() - startTime;
    logger.request("POST", "/sales", userId, duration);
    logger.info("Order created", { orderId, userId, finalAmount });

    res.status(201).json(orderRows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Update order (only pending orders can be edited)
router.put("/:id", authenticateToken, async (req, res, next) => {
  const startTime = Date.now();
  try {
    const {
      customer_id,
      items,
      discount = 0,
    } = req.body;

    if (!items || items.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    const userId = (req as any).user?.id;

    // Get current order
    const [orderRows]: any = await pool.execute(
      `SELECT o.*, 
              m.name as customer_name
       FROM orders o
       LEFT JOIN members m ON o.customer_id = m.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const order = orderRows[0];

    // Only allow editing pending orders
    if (order.status !== 'pending') {
      throw new AppError("Only pending orders can be edited", 400);
    }

    // Restore inventory from old order items
    const [oldItems]: any = await pool.execute(
      "SELECT medicine_id, quantity FROM order_items WHERE order_id = ?",
      [req.params.id]
    );

    for (const oldItem of oldItems) {
      await pool.execute(
        "UPDATE medicines SET quantity = quantity + ? WHERE id = ?",
        [oldItem.quantity, oldItem.medicine_id]
      );
    }

    // Delete old order items
    await pool.execute("DELETE FROM order_items WHERE order_id = ?", [req.params.id]);

    // Calculate new totals
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.price;
    }

    // Calculate member discount if customer is a member
    let memberDiscount = discount;
    if (customer_id) {
      const [memberRows]: any = await pool.execute(
        "SELECT level FROM members WHERE id = ?",
        [customer_id]
      );
      if (memberRows.length > 0) {
        const memberLevel = memberRows[0].level;
        const autoDiscount = calculateMemberDiscount(memberLevel, totalAmount);
        memberDiscount = Math.max(autoDiscount, discount || 0);
      }
    }

    const finalAmount = totalAmount - memberDiscount;

    // Update order
    await pool.execute(
      `UPDATE orders SET customer_id = ?, total_amount = ?, discount = ?, final_amount = ? WHERE id = ?`,
      [customer_id || null, totalAmount, memberDiscount, finalAmount, req.params.id]
    );

    // Create new order items
    for (const item of items) {
      // Check stock availability
      const [medRows]: any = await pool.execute(
        "SELECT quantity FROM medicines WHERE id = ?",
        [item.medicine_id]
      );
      if (medRows.length === 0) {
        throw new AppError(`Medicine with id ${item.medicine_id} not found`, 404);
      }
      if (medRows[0].quantity < item.quantity) {
        throw new AppError(`Insufficient stock for medicine ${item.medicine_id}. Available: ${medRows[0].quantity}, Requested: ${item.quantity}`, 400);
      }

      const itemId = `${req.params.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await pool.execute(
        `INSERT INTO order_items (id, order_id, medicine_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          req.params.id,
          item.medicine_id,
          item.quantity,
          item.price,
          item.quantity * item.price,
        ]
      );
      // Note: tr_sale_update_stock trigger will automatically update inventory
    }

    // Get updated order with details
    const [updatedOrderRows]: any = await pool.execute(
      `SELECT o.*, 
              m.name as customer_name, m.phone as customer_phone,
              u.name as staff_name
       FROM orders o
       LEFT JOIN members m ON o.customer_id = m.id
       LEFT JOIN users u ON o.staff_id = u.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    const [orderItems]: any = await pool.execute(
      `SELECT oi.*, med.name as medicine_name 
       FROM order_items oi 
       JOIN medicines med ON oi.medicine_id = med.id 
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [req.params.id]
    );

    updatedOrderRows[0].items = orderItems;

    const duration = Date.now() - startTime;
    logger.request("PUT", `/sales/${req.params.id}`, userId, duration);
    logger.info("Order updated", { orderId: req.params.id, userId, finalAmount });

    res.json(updatedOrderRows[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

// Update order status
router.put("/:id/status", authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = (req as any).user?.id;

    if (!["pending", "completed", "cancelled"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    // Get order details
    const [orderRows]: any = await pool.execute(
      `SELECT o.*, 
              m.name as customer_name
       FROM orders o
       LEFT JOIN members m ON o.customer_id = m.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const order = orderRows[0];

    // Update status
    await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);

    // If order is completed and has a member customer, add points and check for upgrade
    if (status === "completed" && order.customer_id) {
      try {
        // Get member info
        const [memberRows]: any = await pool.execute(
          "SELECT level, points FROM members WHERE id = ?",
          [order.customer_id]
        );

        if (memberRows.length > 0) {
          const member = memberRows[0];
          const pointsToAdd = calculatePointsToAdd(
            member.level,
            parseFloat(order.final_amount)
          );

          if (pointsToAdd > 0) {
            const newPoints = member.points + pointsToAdd;
            
            // Check if should upgrade
            const newLevel = getUpgradeLevel(newPoints);
            
            // Update member points and level if upgraded
            if (newLevel && newLevel !== member.level) {
              await pool.execute(
                "UPDATE members SET points = ?, level = ? WHERE id = ?",
                [newPoints, newLevel, order.customer_id]
              );
              logger.info("Member upgraded", {
                memberId: order.customer_id,
                oldLevel: member.level,
                newLevel,
                points: newPoints,
              });
            } else {
              await pool.execute(
                "UPDATE members SET points = ? WHERE id = ?",
                [newPoints, order.customer_id]
              );
            }

            logger.info("Points added to member", {
              memberId: order.customer_id,
              pointsAdded: pointsToAdd,
              totalPoints: newPoints,
              orderId: order.id,
            });
          }
        }
      } catch (pointsError) {
        console.error("Error updating member points:", pointsError);
        // Don't fail the order update if points update fails
      }
    }

    // Create notification based on status
    try {
      if (order.staff_id) {
        if (status === "completed") {
          await notifyOrderCompleted(
            order.staff_id,
            order.id,
            parseFloat(order.final_amount),
            order.customer_name || null
          );
        } else if (status === "cancelled") {
          await notifyOrderCancelled(
            order.staff_id,
            order.id,
            parseFloat(order.final_amount),
            order.customer_name || null
          );
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    res.json({ message: "Order status updated", status });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    handleDatabaseError(error);
  }
});

export default router;
