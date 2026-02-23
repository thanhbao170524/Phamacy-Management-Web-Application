USE pharmat;

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

