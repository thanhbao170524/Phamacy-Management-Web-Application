import express from "express";
import pool from "../config/database";
import { authenticateToken, requireRole } from "../middleware/auth";
import { notifySettingsUpdated } from "../utils/notificationHelper";

const router = express.Router();

// Get all settings
router.get("/", async (req, res) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT `key`, value, description FROM settings"
    );

    // Transform to key-value object
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Get notification settings (must be before /:key route)
router.get("/notifications", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT `key`, value FROM settings WHERE `key` LIKE 'notification_%'"
    );

    const notifications: Record<string, boolean> = {};
    rows.forEach((row: any) => {
      const key = row.key.replace('notification_', '');
      notifications[key] = row.value === 'true' || row.value === '1';
    });

    // Default settings if not exists
    const defaultSettings = {
      expiry: true,
      low_stock: true,
      new_order: false,
      weekly_report: true
    };

    const result = { ...defaultSettings, ...notifications };
    res.json(result);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});

// Get setting by key (must be after all specific routes)
router.get("/:key", async (req, res) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT `key`, value, description FROM settings WHERE `key` = ?",
      [req.params.key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({
      key: rows[0].key,
      value: rows[0].value,
      description: rows[0].description,
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// Update setting (must be after /notifications route)
router.put("/:key", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { value, description } = req.body;

    await pool.execute(
      "UPDATE settings SET value = ?, description = ? WHERE `key` = ?",
      [value, description || null, req.params.key]
    );

    const [rows]: any = await pool.execute(
      "SELECT `key`, value, description FROM settings WHERE `key` = ?",
      [req.params.key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Setting not found" });
    }

    // Get performer name for notification
    const userId = (req as any).user?.id;
    let performerName: string | undefined;
    if (userId) {
      const [performerRows]: any = await pool.execute("SELECT name FROM users WHERE id = ?", [userId]);
      performerName = performerRows[0]?.name;
    }

    // Send notification to all admins
    if (userId) {
      notifySettingsUpdated(
        req.params.key,
        value,
        userId,
        performerName
      ).catch((error) => {
        console.error("Failed to send settings update notification:", error);
      });
    }

    res.json({
      key: rows[0].key,
      value: rows[0].value,
      description: rows[0].description,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// Update multiple settings
router.put("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const settings = req.body; // { key1: value1, key2: value2 }

    // Get performer name for notification
    const userId = (req as any).user?.id;
    let performerName: string | undefined;
    if (userId) {
      const [performerRows]: any = await pool.execute("SELECT name FROM users WHERE id = ?", [userId]);
      performerName = performerRows[0]?.name;
    }

    // Update settings and send notifications
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        "UPDATE settings SET value = ? WHERE `key` = ?",
        [value, key]
      );

      // Send notification for each updated setting
      if (userId && typeof value === 'string') {
        notifySettingsUpdated(
          key,
          value,
          userId,
          performerName
        ).catch((error) => {
          console.error(`Failed to send settings update notification for ${key}:`, error);
        });
      }
    }

    // Return updated settings
    const [rows]: any = await pool.execute(
      "SELECT `key`, value, description FROM settings"
    );

    const result: Record<string, string> = {};
    rows.forEach((row: any) => {
      result[row.key] = row.value;
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Update notification settings (must be before /:key route)
router.put("/notifications", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const settings = req.body; // { expiry: true, low_stock: false, ... }
    const userId = (req as any).user?.id;

    // Update each notification setting
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `notification_${key}`;
      await pool.execute(
        "INSERT INTO settings (`key`, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
        [
          settingKey,
          value ? 'true' : 'false',
          `Cài đặt thông báo: ${key}`,
          value ? 'true' : 'false'
        ]
      );
    }

    res.json({ message: "Notification settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});

// Backup/Export data
router.post("/backup/export", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    // Get all important data
    const [medicines] = await pool.execute("SELECT * FROM medicines");
    const [categories] = await pool.execute("SELECT * FROM medicine_categories");
    const [members] = await pool.execute("SELECT * FROM members");
    const [orders] = await pool.execute("SELECT * FROM orders");
    const [orderItems] = await pool.execute("SELECT * FROM order_items");
    const [inventory] = await pool.execute("SELECT * FROM inventory_records");
    const [settings] = await pool.execute("SELECT * FROM settings");

    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        medicines: medicines,
        categories: categories,
        members: members,
        orders: orders,
        order_items: orderItems,
        inventory_records: inventory,
        settings: settings
      }
    };

    res.json(backupData);
  } catch (error) {
    console.error("Error exporting backup:", error);
    res.status(500).json({ error: "Failed to export backup" });
  }
});

// Restore/Import data
router.post("/backup/import", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.medicines || !data.categories) {
      return res.status(400).json({ error: "Invalid backup data format" });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Import categories first (foreign key dependency)
      if (data.categories && Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          await connection.execute(
            "INSERT INTO medicine_categories (id, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
            [cat.id, cat.name, cat.description || null]
          );
        }
      }

      // Import medicines
      if (data.medicines && Array.isArray(data.medicines)) {
        for (const med of data.medicines) {
          await connection.execute(
            "INSERT INTO medicines (id, name, description, category_id, price, quantity, expiry_date, stock_alert, barcode, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), category_id = VALUES(category_id), price = VALUES(price), quantity = VALUES(quantity), expiry_date = VALUES(expiry_date), stock_alert = VALUES(stock_alert), barcode = VALUES(barcode), manufacturer = VALUES(manufacturer)",
            [med.id, med.name, med.description || null, med.category_id, med.price, med.quantity, med.expiry_date || null, med.stock_alert || 20, med.barcode || null, med.manufacturer || null]
          );
        }
      }

      // Import members
      if (data.members && Array.isArray(data.members)) {
        for (const member of data.members) {
          await connection.execute(
            "INSERT INTO members (id, name, email, phone, level, points) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), level = VALUES(level), points = VALUES(points)",
            [member.id, member.name, member.email || null, member.phone, member.level || 'bronze', member.points || 0]
          );
        }
      }

      // Import settings
      if (data.settings && Array.isArray(data.settings)) {
        for (const setting of data.settings) {
          await connection.execute(
            "INSERT INTO settings (`key`, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)",
            [setting.key, setting.value || null, setting.description || null]
          );
        }
      }

      await connection.commit();
      res.json({ message: "Data imported successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error importing backup:", error);
    res.status(500).json({ error: "Failed to import backup" });
  }
});

export default router;

