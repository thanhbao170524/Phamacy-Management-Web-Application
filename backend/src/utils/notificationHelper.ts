import pool from "../config/database";
import { logger } from "./logger";

/**
 * Helper function to create a notification for a user
 */
export async function createNotification(
  userId: string,
  title: string,
  message?: string
): Promise<void> {
  try {
    const id = `N${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.execute(
      "INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)",
      [id, userId, title, message || null]
    );

    logger.info("Notification created", { notificationId: id, userId, title });
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error - notifications are non-critical
  }
}

/**
 * Create notification for order completion
 */
export async function notifyOrderCompleted(
  userId: string,
  orderId: string,
  finalAmount: number,
  customerName?: string | null
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(finalAmount);

  const title = `Đơn hàng ${orderId} đã hoàn thành`;
  const message = customerName
    ? `Đơn hàng của khách hàng ${customerName} với tổng giá trị ${formattedAmount} đã được thanh toán thành công.`
    : `Đơn hàng với tổng giá trị ${formattedAmount} đã được thanh toán thành công.`;

  await createNotification(userId, title, message);
}

/**
 * Create notification for order cancellation
 */
export async function notifyOrderCancelled(
  userId: string,
  orderId: string,
  finalAmount: number,
  customerName?: string | null
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(finalAmount);

  const title = `Đơn hàng ${orderId} đã bị hủy`;
  const message = customerName
    ? `Đơn hàng của khách hàng ${customerName} với tổng giá trị ${formattedAmount} đã bị hủy.`
    : `Đơn hàng với tổng giá trị ${formattedAmount} đã bị hủy.`;

  await createNotification(userId, title, message);
}

/**
 * Create notification for inventory operations (import/export)
 * Notifies all admin and inventory_staff users
 */
export async function notifyInventoryOperation(
  type: 'import' | 'export',
  medicineName: string,
  quantity: number,
  performedBy: string,
  performedByName?: string,
  notes?: string | null
): Promise<void> {
  try {
    // Get all admin and inventory_staff users
    const [users]: any = await pool.execute(
      "SELECT id FROM users WHERE (role = 'admin' OR role = 'inventory_staff') AND active = TRUE"
    );

    if (!users || users.length === 0) {
      logger.warn("No admin or inventory_staff users found to notify");
      return;
    }

    const operationLabel = type === 'import' ? 'Nhập kho' : 'Xuất kho';
    const title = `${operationLabel}: ${medicineName}`;
    
    let message = `${performedByName || 'Người dùng'} đã thực hiện ${operationLabel.toLowerCase()} `;
    message += `${quantity} ${medicineName}`;
    if (notes) {
      message += ` - Ghi chú: ${notes}`;
    }

    // Create notification for each user
    const notificationPromises = users.map((user: { id: string }) =>
      createNotification(user.id, title, message)
    );

    await Promise.all(notificationPromises);
    
    logger.info("Inventory operation notifications sent", {
      type,
      medicineName,
      quantity,
      notifiedUsers: users.length
    });
  } catch (error) {
    console.error("Error sending inventory operation notifications:", error);
    // Don't throw error - notifications are non-critical
  }
}

/**
 * Create notification for staff operations (create, update, delete)
 * Notifies all admin users
 */
export async function notifyStaffOperation(
  operation: 'created' | 'updated' | 'deleted',
  staffName: string,
  staffEmail: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  try {
    // Get all admin users
    const [users]: any = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' AND active = TRUE"
    );

    if (!users || users.length === 0) {
      logger.warn("No admin users found to notify");
      return;
    }

    const operationLabels: Record<string, string> = {
      'created': 'Thêm nhân viên',
      'updated': 'Cập nhật nhân viên',
      'deleted': 'Xóa nhân viên'
    };

    const title = `${operationLabels[operation]}: ${staffName}`;
    let message = `${performedByName || 'Người dùng'} đã ${operation === 'created' ? 'thêm' : operation === 'updated' ? 'cập nhật' : 'xóa'} nhân viên ${staffName}`;
    if (operation !== 'deleted') {
      message += ` (${staffEmail})`;
    }

    // Create notification for each admin user
    const notificationPromises = users.map((user: { id: string }) =>
      createNotification(user.id, title, message)
    );

    await Promise.all(notificationPromises);
    
    logger.info("Staff operation notifications sent", {
      operation,
      staffName,
      notifiedUsers: users.length
    });
  } catch (error) {
    console.error("Error sending staff operation notifications:", error);
    // Don't throw error - notifications are non-critical
  }
}

/**
 * Create notification for member operations (create, update)
 * Notifies all admin users
 */
export async function notifyMemberOperation(
  operation: 'created' | 'updated',
  memberName: string,
  memberPhone: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  try {
    // Get all admin users
    const [users]: any = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' AND active = TRUE"
    );

    if (!users || users.length === 0) {
      logger.warn("No admin users found to notify");
      return;
    }

    const operationLabels: Record<string, string> = {
      'created': 'Thêm thành viên',
      'updated': 'Cập nhật thành viên'
    };

    const title = `${operationLabels[operation]}: ${memberName}`;
    const message = `${performedByName || 'Người dùng'} đã ${operation === 'created' ? 'thêm' : 'cập nhật'} thành viên ${memberName} (${memberPhone})`;

    // Create notification for each admin user
    const notificationPromises = users.map((user: { id: string }) =>
      createNotification(user.id, title, message)
    );

    await Promise.all(notificationPromises);
    
    logger.info("Member operation notifications sent", {
      operation,
      memberName,
      notifiedUsers: users.length
    });
  } catch (error) {
    console.error("Error sending member operation notifications:", error);
    // Don't throw error - notifications are non-critical
  }
}

/**
 * Create notification for settings update
 * Notifies all admin users
 */
export async function notifySettingsUpdated(
  settingKey: string,
  settingValue: string,
  performedBy: string,
  performedByName?: string
): Promise<void> {
  try {
    // Get all admin users
    const [users]: any = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' AND active = TRUE"
    );

    if (!users || users.length === 0) {
      logger.warn("No admin users found to notify");
      return;
    }

    // Map setting keys to Vietnamese labels
    const settingLabels: Record<string, string> = {
      'pharmacy_name': 'Tên nhà thuốc',
      'pharmacy_address': 'Địa chỉ nhà thuốc',
      'pharmacy_phone': 'Số điện thoại',
      'pharmacy_email': 'Email nhà thuốc'
    };

    const settingLabel = settingLabels[settingKey] || settingKey;
    const title = `Cập nhật cài đặt: ${settingLabel}`;
    const message = `${performedByName || 'Người dùng'} đã cập nhật ${settingLabel.toLowerCase()} thành "${settingValue}"`;

    // Create notification for each admin user
    const notificationPromises = users.map((user: { id: string }) =>
      createNotification(user.id, title, message)
    );

    await Promise.all(notificationPromises);
    
    logger.info("Settings update notifications sent", {
      settingKey,
      notifiedUsers: users.length
    });
  } catch (error) {
    console.error("Error sending settings update notifications:", error);
    // Don't throw error - notifications are non-critical
  }
}
