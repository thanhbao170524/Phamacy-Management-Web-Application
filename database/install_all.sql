-- =====================================================
-- PharmaT Database Installation Script - Complete
-- Tổng hợp tất cả các file SQL để cài đặt database
-- =====================================================

-- =====================================================
-- PHẦN 1: TẠO DATABASE
-- =====================================================
-- Create database
CREATE DATABASE IF NOT EXISTS pharmat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pharmat;

-- =====================================================
-- PHẦN 2: TẠO CÁC BẢNG
-- =====================================================
-- Bảng 1: users (Nhân Viên)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'sales_staff', 'inventory_staff') NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng 2: medicine_categories (Danh Mục Thuốc)
CREATE TABLE IF NOT EXISTS medicine_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 3: medicines (Thuốc)
CREATE TABLE IF NOT EXISTS medicines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 0,
  expiry_date DATE,
  stock_alert INT DEFAULT 20,
  barcode VARCHAR(100) UNIQUE,
  manufacturer VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES medicine_categories(id)
);

-- Bảng 4: inventory_records (Lịch Sử Nhập Xuất Kho)
CREATE TABLE IF NOT EXISTS inventory_records (
  id VARCHAR(50) PRIMARY KEY,
  medicine_id VARCHAR(50) NOT NULL,
  type ENUM('import', 'export') NOT NULL,
  quantity INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng 5: members (Thành Viên - Khách Hàng)
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  level ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng 6: orders (Đơn Hàng)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  staff_id VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- Bảng 7: order_items (Chi Tiết Đơn Hàng)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  medicine_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Bảng 8: alerts (Cảnh Báo)
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('expiry', 'low_stock', 'system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  user_id VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 9: settings (Cài Đặt Hệ Thống)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng 10: notifications (Thông Báo)
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
);

-- =====================================================
-- PHẦN 3: TẠO CÁC INDEX
-- =====================================================
-- Indexes cho hiệu suất tìm kiếm
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory_records(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_records(user_id);
CREATE INDEX IF NOT EXISTS idx_order_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_staff ON orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_order_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_members_level ON members(level);

-- Performance optimization indexes (Added 2025-10-31)
-- Critical: Index for order items JOIN queries (fixes N+1 query performance)
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine ON order_items(medicine_id);

-- Composite indexes for filtered date range queries
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_type_date ON inventory_records(type, created_at);

-- =====================================================
-- PHẦN 4: DỮ LIỆU MẪU
-- =====================================================
-- Insert Danh Mục Mặc Định
INSERT INTO medicine_categories (name, description) VALUES
('Kháng sinh', 'Thuốc kháng sinh điều trị nhiễm khuẩn'),
('Giảm đau', 'Thuốc giảm đau và hạ sốt'),
('Vitamin', 'Bổ sung vitamin và khoáng chất')
ON DUPLICATE KEY UPDATE name=name;

-- Insert Admin User (password: password - bcrypt hashed)
INSERT INTO users (id, name, email, password, role, phone, avatar) VALUES
('U001', 'Nguyễn Văn A', 'admin@pharmat.com', '$2a$10$zdfnOwycHte6BOWDOK/8tela7Dgz0bpzkFDTaRSFC2hbGya878/Jq', 'admin', '0901234567', 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=313fb2&color=fff'),
('U002', 'Trần Thị B', 'sales@pharmat.com', '$2a$10$zdfnOwycHte6BOWDOK/8tela7Dgz0bpzkFDTaRSFC2hbGya878/Jq', 'sales_staff', '0902345678', 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=4361ee&color=fff'),
('U003', 'Lê Văn C', 'inventory@pharmat.com', '$2a$10$zdfnOwycHte6BOWDOK/8tela7Dgz0bpzkFDTaRSFC2hbGya878/Jq', 'inventory_staff', '0903456789', 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=fff')
ON DUPLICATE KEY UPDATE name=name;

-- Insert Settings
INSERT INTO settings (`key`, value, description) VALUES
('pharmacy_name', 'Nhà Thuốc PharmaT', 'Tên nhà thuốc'),
('pharmacy_address', '123 Đường ABC, Quận XYZ, TP.HCM', 'Địa chỉ nhà thuốc'),
('pharmacy_phone', '0901234567', 'Số điện thoại'),
('pharmacy_email', 'info@pharmat.com', 'Email nhà thuốc')
ON DUPLICATE KEY UPDATE value=value;

-- Insert Sample Medicines
INSERT INTO medicines (id, name, description, category_id, price, quantity, expiry_date, stock_alert, barcode, manufacturer) VALUES
('M001', 'Paracetamol 500mg', 'Thuốc giảm đau, hạ sốt', 2, 15000.00, 150, '2025-12-31', 20, '8936017180001', 'Công ty ABC'),
('M002', 'Amoxicillin 500mg', 'Kháng sinh điều trị nhiễm khuẩn', 1, 45000.00, 5, '2024-12-15', 30, '8936017180002', 'Công ty XYZ'),
('M003', 'Vitamin C 1000mg', 'Bổ sung vitamin C tăng cường miễn dịch', 3, 25000.00, 200, '2025-06-30', 50, '8936017180003', 'Công ty DEF'),
('M004', 'Ibuprofen 400mg', 'Giảm đau, chống viêm', 2, 30000.00, 80, '2025-08-20', 20, '8936017180004', 'Công ty GHI'),
('M005', 'Aspirin 75mg', 'Giảm đau, chống đông máu', 2, 12000.00, 120, '2025-09-15', 30, '8936017180005', 'Công ty JKL')
ON DUPLICATE KEY UPDATE name=name;

-- Insert Sample Members
INSERT INTO members (id, name, email, phone, level, points) VALUES
('C001', 'Nguyễn Thị Lan', 'lan.nguyen@email.com', '0901234567', 'gold', 1560),
('C002', 'Trần Văn Nam', 'nam.tran@email.com', '0902345678', 'silver', 850),
('C003', 'Lê Thị Hoa', 'hoa.le@email.com', '0903456789', 'bronze', 320),
('C004', 'Phạm Minh Tuấn', 'tuan.pham@email.com', '0904567890', 'bronze', 150)
ON DUPLICATE KEY UPDATE name=name;

-- Insert Sample Orders
INSERT INTO orders (id, customer_id, staff_id, total_amount, discount, final_amount, status, created_at) VALUES
('ORD-001', 'C001', 'U002', 75000.00, 5000.00, 70000.00, 'completed', NOW() - INTERVAL 1 DAY),
('ORD-002', 'C002', 'U002', 45000.00, 0, 45000.00, 'completed', NOW() - INTERVAL 2 HOUR),
('ORD-003', 'C003', 'U002', 35000.00, 0, 35000.00, 'completed', NOW() - INTERVAL 5 HOUR),
('ORD-004', NULL, 'U002', 20000.00, 0, 20000.00, 'completed', NOW() - INTERVAL 1 HOUR)
ON DUPLICATE KEY UPDATE id=id;

-- Insert Sample Order Items
INSERT INTO order_items (id, order_id, medicine_id, quantity, price, subtotal) VALUES
('OI001', 'ORD-001', 'M001', 3, 15000.00, 45000.00),
('OI002', 'ORD-001', 'M003', 1, 25000.00, 25000.00),
('OI003', 'ORD-002', 'M001', 2, 15000.00, 30000.00),
('OI004', 'ORD-002', 'M004', 1, 30000.00, 30000.00),
('OI005', 'ORD-003', 'M005', 2, 12000.00, 24000.00),
('OI006', 'ORD-003', 'M003', 1, 25000.00, 25000.00),
('OI007', 'ORD-004', 'M001', 1, 15000.00, 15000.00)
ON DUPLICATE KEY UPDATE id=id;

-- =====================================================
-- PHẦN 5: TẠO CÁC VIEW
-- =====================================================
-- View: Top Selling Medicines
CREATE OR REPLACE VIEW v_top_selling_medicines AS
SELECT 
  m.id,
  m.name,
  mc.name as category_name,
  m.category_id,
  COALESCE(SUM(oi.quantity), 0) as total_sold,
  COALESCE(SUM(oi.subtotal), 0) as total_revenue
FROM medicines m
LEFT JOIN medicine_categories mc ON m.category_id = mc.id
LEFT JOIN order_items oi ON m.id = oi.medicine_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY m.id, m.name, mc.name, m.category_id
ORDER BY total_sold DESC;

-- View: Expiring Medicines (within 30 days)
CREATE OR REPLACE VIEW v_expiring_medicines AS
SELECT 
  id,
  name,
  expiry_date,
  quantity,
  DATEDIFF(expiry_date, CURDATE()) as days_until_expiry
FROM medicines
WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
AND quantity > 0
ORDER BY expiry_date ASC;

-- View: Low Stock Medicines
CREATE OR REPLACE VIEW v_low_stock_medicines AS
SELECT 
  id,
  name,
  quantity,
  stock_alert
FROM medicines
WHERE quantity <= stock_alert
ORDER BY quantity ASC;

-- View: Daily Sales Summary
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_orders,
  SUM(final_amount) as total_revenue,
  AVG(final_amount) as average_order_value
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- View: Staff Performance
CREATE OR REPLACE VIEW v_staff_performance AS
SELECT 
  u.id,
  u.name,
  u.role,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.final_amount), 0) as total_revenue,
  COALESCE(AVG(o.final_amount), 0) as avg_order_value
FROM users u
LEFT JOIN orders o ON u.id = o.staff_id AND o.status = 'completed'
WHERE u.role IN ('admin', 'sales_staff')
GROUP BY u.id, u.name, u.role;

-- =====================================================
-- PHẦN 6: TẠO CÁC TRIGGER
-- =====================================================
-- Trigger: Update Medicine Stock After Inventory Record
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_inventory_update_stock
AFTER INSERT ON inventory_records
FOR EACH ROW
BEGIN
  IF NEW.type = 'import' THEN
    UPDATE medicines 
    SET quantity = quantity + NEW.quantity 
    WHERE id = NEW.medicine_id;
  ELSE
    UPDATE medicines 
    SET quantity = GREATEST(0, quantity - NEW.quantity)
    WHERE id = NEW.medicine_id;
  END IF;
END//

-- Trigger: Update Medicine Stock After Sale
CREATE TRIGGER IF NOT EXISTS tr_sale_update_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE medicines 
  SET quantity = GREATEST(0, quantity - NEW.quantity)
  WHERE id = NEW.medicine_id;
END//

-- Trigger: Auto-generate Alerts for Expiring Medicines and Low Stock
-- Fixed: Prevent duplicate alerts by checking existing alerts
-- Severity levels:
--   HIGH: Hết hạn, Hết hàng
--   MEDIUM: Sắp hết hạn (within 30 days)
--   LOW: Sắp hết hàng (quantity <= stock_alert)
CREATE TRIGGER IF NOT EXISTS tr_check_expiry_alert
AFTER UPDATE ON medicines
FOR EACH ROW
BEGIN
  DECLARE expired_alert_exists INT DEFAULT 0;
  DECLARE expiring_alert_exists INT DEFAULT 0;
  DECLARE low_stock_alert_exists INT DEFAULT 0;

  -- Check for expired medicines (HIGH severity)
  -- Only create alert if expiry_date changed AND medicine is expired AND quantity > 0
  IF NEW.expiry_date IS NOT NULL
     AND NEW.expiry_date <= CURDATE()
     AND NEW.quantity > 0
     AND (NEW.expiry_date != OLD.expiry_date OR NEW.quantity != OLD.quantity) THEN

    -- Check if similar alert already exists in the last 24 hours
    SELECT COUNT(*) INTO expired_alert_exists
    FROM alerts
    WHERE type = 'expiry'
      AND message LIKE CONCAT('%', NEW.name, '%')
      AND message LIKE '%hết hạn%'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND is_read = FALSE
    LIMIT 1;

    IF expired_alert_exists = 0 THEN
      INSERT INTO alerts (id, type, title, message, severity)
      VALUES (
        CONCAT('ALRT-', UNIX_TIMESTAMP(NOW()), '-', SUBSTRING(MD5(RAND()), 1, 8)),
        'expiry',
        CONCAT('Thuốc hết hạn: ', NEW.name),
        CONCAT(NEW.name, ' hết hạn vào ', DATE_FORMAT(NEW.expiry_date, '%d/%m/%Y')),
        'high'
      );
    END IF;
  END IF;

  -- Check for expiring medicines within 30 days (MEDIUM severity)
  -- Only create alert if expiry_date changed AND no similar alert exists today
  IF NEW.expiry_date IS NOT NULL
     AND NEW.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
     AND NEW.expiry_date > CURDATE()
     AND NEW.quantity > 0
     AND (NEW.expiry_date != OLD.expiry_date OR NEW.quantity != OLD.quantity) THEN

    -- Check if similar alert already exists in the last 24 hours
    SELECT COUNT(*) INTO expiring_alert_exists
    FROM alerts
    WHERE type = 'expiry'
      AND message LIKE CONCAT('%', NEW.name, '%')
      AND message LIKE '%sắp hết hạn%'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND is_read = FALSE
    LIMIT 1;

    IF expiring_alert_exists = 0 THEN
      INSERT INTO alerts (id, type, title, message, severity)
      VALUES (
        CONCAT('ALRT-', UNIX_TIMESTAMP(NOW()), '-', SUBSTRING(MD5(RAND()), 1, 8)),
        'expiry',
        CONCAT('Thuốc sắp hết hạn: ', NEW.name),
        CONCAT(NEW.name, ' sẽ hết hạn vào ', DATE_FORMAT(NEW.expiry_date, '%d/%m/%Y')),
        'medium'
      );
    END IF;
  END IF;

  -- Check for low stock - sắp hết hàng (LOW severity)
  -- Only create alert if quantity changed to/below threshold AND no similar alert exists today
  IF NEW.quantity <= NEW.stock_alert
     AND NEW.quantity > 0
     AND OLD.quantity != NEW.quantity THEN

    -- Check if similar alert already exists in the last 24 hours
    SELECT COUNT(*) INTO low_stock_alert_exists
    FROM alerts
    WHERE type = 'low_stock'
      AND message LIKE CONCAT('%', NEW.name, '%')
      AND message LIKE '%sắp hết%'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND is_read = FALSE
    LIMIT 1;

    IF low_stock_alert_exists = 0 THEN
      INSERT INTO alerts (id, type, title, message, severity)
      VALUES (
        CONCAT('ALRT-', UNIX_TIMESTAMP(NOW()), '-', SUBSTRING(MD5(RAND()), 1, 8)),
        'low_stock',
        CONCAT('Hàng sắp hết: ', NEW.name),
        CONCAT(NEW.name, ' còn ', NEW.quantity, ' sản phẩm trong kho (ngưỡng cảnh báo: ', NEW.stock_alert, ')'),
        'low'
      );
    END IF;
  END IF;

  -- Check for out of stock - đã hết hàng (HIGH severity)
  -- Only when transitioning from in-stock to out-of-stock
  IF NEW.quantity = 0 AND OLD.quantity > 0 THEN
    -- Out of stock alerts are always created (important event)
    INSERT INTO alerts (id, type, title, message, severity)
    VALUES (
      CONCAT('ALRT-', UNIX_TIMESTAMP(NOW()), '-', SUBSTRING(MD5(RAND()), 1, 8)),
      'low_stock',
      CONCAT('Hết hàng: ', NEW.name),
      CONCAT(NEW.name, ' đã hết hàng'),
      'high'
    );
  END IF;
END//
DELIMITER ;

-- =====================================================
-- HOÀN TẤT CÀI ĐẶT
-- =====================================================
SELECT 'Database installation completed successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_categories FROM medicine_categories;
SELECT COUNT(*) as total_medicines FROM medicines;
SELECT COUNT(*) as total_members FROM members;

