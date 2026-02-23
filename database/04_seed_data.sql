USE pharmat;

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

