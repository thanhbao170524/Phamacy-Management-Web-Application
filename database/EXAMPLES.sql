-- PharmaT Database - Example Queries
-- Sử dụng file này để test các queries cơ bản

USE pharmat;

-- ==================================================
-- 1. QUERIES CƠ BẢN
-- ==================================================

-- Lấy tất cả thuốc
SELECT m.id, m.name, mc.name as category, m.price, m.quantity
FROM medicines m
JOIN medicine_categories mc ON m.category_id = mc.id;

-- Tìm thuốc theo tên
SELECT * FROM medicines WHERE name LIKE '%Paracetamol%';

-- Lấy thuốc sắp hết hạn
SELECT id, name, expiry_date, 
       DATEDIFF(expiry_date, CURDATE()) as days_left
FROM medicines
WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY expiry_date ASC;

-- Thuốc sắp hết trong kho
SELECT id, name, quantity, stock_alert
FROM medicines
WHERE quantity <= stock_alert;

-- ==================================================
-- 2. THỐNG KÊ BÁN HÀNG
-- ==================================================

-- Doanh thu hôm nay
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(final_amount) as revenue
FROM orders
WHERE DATE(created_at) = CURDATE()
AND status = 'completed';

-- Top 5 thuốc bán chạy nhất
SELECT 
  m.name,
  mc.name as category,
  SUM(oi.quantity) as total_sold,
  SUM(oi.subtotal) as revenue
FROM order_items oi
JOIN medicines m ON oi.medicine_id = m.id
JOIN medicine_categories mc ON m.category_id = mc.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY m.id, m.name, mc.name
ORDER BY total_sold DESC
LIMIT 5;

-- Doanh thu theo ngày trong tuần
SELECT 
  DAYNAME(created_at) as day_name,
  DAYOFWEEK(created_at) as day_num,
  COUNT(*) as orders,
  SUM(final_amount) as revenue,
  AVG(final_amount) as avg_order
FROM orders
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
AND status = 'completed'
GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
ORDER BY day_num;

-- ==================================================
-- 3. LỊCH SỬ KHO
-- ==================================================

-- Nhập xuất kho hôm nay
SELECT 
  ir.id,
  m.name as medicine,
  ir.type,
  ir.quantity,
  u.name as staff,
  ir.created_at
FROM inventory_records ir
JOIN medicines m ON ir.medicine_id = m.id
JOIN users u ON ir.user_id = u.id
WHERE DATE(ir.created_at) = CURDATE()
ORDER BY ir.created_at DESC;

-- Tổng nhập xuất theo thuốc
SELECT 
  m.name,
  SUM(CASE WHEN ir.type = 'import' THEN ir.quantity ELSE 0 END) as total_import,
  SUM(CASE WHEN ir.type = 'export' THEN ir.quantity ELSE 0 END) as total_export,
  SUM(CASE WHEN ir.type = 'import' THEN ir.quantity ELSE -ir.quantity END) as net_change
FROM inventory_records ir
JOIN medicines m ON ir.medicine_id = m.id
GROUP BY m.id, m.name;

-- ==================================================
-- 4. QUẢN LÝ THÀNH VIÊN
-- ==================================================

-- Thành viên theo hạng
SELECT 
  level,
  COUNT(*) as total_members,
  SUM(points) as total_points,
  AVG(points) as avg_points
FROM members
GROUP BY level
ORDER BY 
  CASE level
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    ELSE 1
  END DESC;

-- Top 10 khách hàng theo điểm
SELECT name, phone, level, points
FROM members
ORDER BY points DESC
LIMIT 10;

-- ==================================================
-- 5. HIỆU SUẤT NHÂN VIÊN
-- ==================================================

-- Hiệu suất nhân viên bán hàng
SELECT 
  u.name,
  COUNT(o.id) as total_orders,
  SUM(o.final_amount) as total_revenue,
  AVG(o.final_amount) as avg_order_value
FROM users u
JOIN orders o ON u.id = o.staff_id
WHERE u.role = 'sales_staff'
AND o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY total_revenue DESC;

-- ==================================================
-- 6. CẢNH BÁO
-- ==================================================

-- Tất cả cảnh báo chưa đọc
SELECT 
  type,
  severity,
  title,
  message,
  created_at
FROM alerts
WHERE is_read = FALSE
ORDER BY 
  CASE severity
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- Đếm cảnh báo theo loại
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread
FROM alerts
GROUP BY type;

-- ==================================================
-- 7. SỬ DỤNG VIEWS
-- ==================================================

-- Xem top thuốc bán chạy (dùng view)
SELECT * FROM v_top_selling_medicines LIMIT 10;

-- Xem thuốc sắp hết hạn (dùng view)
SELECT * FROM v_expiring_medicines;

-- Xem thuốc sắp hết (dùng view)
SELECT * FROM v_low_stock_medicines;

-- Xem thống kê doanh thu theo ngày (dùng view)
SELECT * FROM v_daily_sales LIMIT 7;

-- Xem hiệu suất nhân viên (dùng view)
SELECT * FROM v_staff_performance;

-- ==================================================
-- 8. UPDATE DỮ LIỆU MẪU (TEST)
-- ==================================================

-- Cập nhật số lượng thuốc để test cảnh báo
UPDATE medicines 
SET quantity = 15 
WHERE id = 'M002';

-- Tạo đơn hàng test
INSERT INTO orders (id, customer_id, staff_id, total_amount, final_amount, status)
VALUES ('ORD-TEST', 'C001', 'U002', 50000, 50000, 'completed');

INSERT INTO order_items (id, order_id, medicine_id, quantity, price, subtotal)
VALUES ('OI-TEST', 'ORD-TEST', 'M001', 2, 15000, 30000);

-- ==================================================
-- 9. RESET/DUMP DATA
-- ==================================================

-- Export toàn bộ dữ liệu
-- mysqldump -u root -p pharmat > backup.sql

-- Import dữ liệu
-- mysql -u root -p pharmat < backup.sql

