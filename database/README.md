# PharmaT Database Setup Guide

Hướng dẫn cài đặt và setup database cho hệ thống Quản lý Nhà Thuốc PharmaT.

---

## 📋 Yêu Cầu

- MySQL 5.7+ hoặc MariaDB 10.4+
- XAMPP, WAMP, hoặc MySQL Server độc lập
- phpMyAdmin (optional, để quản lý GUI)

---

## 🚀 Cài Đặt Database

### Cách 1: Sử dụng install.sql (Khuyến nghị - Nhanh nhất)

File `install.sql` sẽ tự động chạy tất cả các scripts theo đúng thứ tự.

**Command Line:**
```bash
# Di chuyển đến thư mục project
cd C:\xampp\htdocs\vibe2\PharmaT

# Đảm bảo MySQL đang chạy
# Chạy install script
mysql -u root -p < database/install.sql
```

**phpMyAdmin:**
1. Mở http://localhost/phpmyadmin
2. Tab "SQL"
3. Copy toàn bộ nội dung file `install.sql`
4. Paste và click "Go"

---

### Cách 2: Import Từng File Theo Thứ Tự

Nếu muốn kiểm soát từng bước, import các file theo thứ tự sau:

**Command Line:**
```bash
cd C:\xampp\htdocs\vibe2\PharmaT

mysql -u root -p < database/01_create_database.sql
mysql -u root -p < database/02_create_tables.sql
mysql -u root -p < database/03_create_indexes.sql
mysql -u root -p < database/04_seed_data.sql
mysql -u root -p < database/05_create_views.sql
mysql -u root -p < database/06_create_triggers.sql
```

**phpMyAdmin:**
1. Mở http://localhost/phpmyadmin
2. Import từng file theo thứ tự 01 → 06
   - Click tab "Import"
   - Chọn file
   - Click "Go"
   - Lặp lại cho mỗi file

---

## 📂 Cấu Trúc Files

| File | Mô Tả | Nội Dung |
|------|-------|----------|
| `01_create_database.sql` | Tạo database | Database `pharmat` và cấu hình charset UTF-8 |
| `02_create_tables.sql` | Tạo tables | 10 tables: users, medicines, orders, members, v.v. |
| `03_create_indexes.sql` | Tạo indexes | **17 indexes** để tối ưu performance |
| `04_seed_data.sql` | Dữ liệu mẫu | Admin user, categories, sample medicines, members |
| `05_create_views.sql` | Tạo views | 5 views để reporting và analytics |
| `06_create_triggers.sql` | Tạo triggers | 3 triggers tự động: stock update, alerts |

---

## ✨ Performance Optimizations

Database này đã được tối ưu với:

### 🚀 17 Indexes
- **Critical indexes** cho order_items (fix N+1 query problem)
- **Composite indexes** cho filtered queries
- **Foreign key indexes** cho JOINs

### 🎯 Smart Triggers
- Tự động cập nhật stock khi có nhập/xuất/bán hàng
- Tự động tạo alerts cho thuốc sắp hết hạn / sắp hết hàng
- **Ngăn chặn duplicate alerts** (đã được fix!)

### 📊 Reporting Views
- Top selling medicines
- Expiring medicines
- Low stock medicines
- Daily sales statistics
- Staff performance

---

## 🔐 Thông Tin Đăng Nhập Mặc Định

Sau khi setup database, bạn có thể đăng nhập với:

**Admin Account:**
- Email: `admin@pharmat.com`
- Password: `admin123`

**Staff Account (Sales):**
- Email: `staff1@pharmat.com`
- Password: `staff123`

**Staff Account (Inventory):**
- Email: `staff2@pharmat.com`
- Password: `staff123`

⚠️ **Lưu ý:** Đổi password ngay sau lần đăng nhập đầu tiên!

---

## 🗃️ Cấu Trúc Database

### Tables (10)

| Table | Mục Đích | Rows (Seed) |
|-------|----------|-------------|
| `users` | Quản lý nhân viên | 3 |
| `medicine_categories` | Danh mục thuốc | 10 |
| `medicines` | Kho thuốc | 20 |
| `inventory_records` | Lịch sử nhập/xuất | 0 |
| `members` | Khách hàng thân thiết | 5 |
| `orders` | Đơn hàng | 0 |
| `order_items` | Chi tiết đơn hàng | 0 |
| `alerts` | Cảnh báo hệ thống | 0 |
| `settings` | Cấu hình nhà thuốc | 5 |
| `notifications` | Thông báo user | 0 (chưa dùng) |

### Views (5)

- `v_top_selling_medicines` - Thuốc bán chạy
- `v_expiring_medicines` - Thuốc sắp hết hạn
- `v_low_stock_medicines` - Thuốc sắp hết
- `v_daily_sales` - Doanh thu theo ngày
- `v_staff_performance` - Hiệu suất nhân viên

### Triggers (3)

- `tr_inventory_update_stock` - Update stock khi nhập/xuất
- `tr_sale_update_stock` - Update stock khi bán hàng
- `tr_check_expiry_alert` - Tự động tạo alerts (đã fix duplicate)

---

## ✅ Verify Installation

Sau khi cài đặt, kiểm tra xem database đã setup thành công:

```sql
-- Kiểm tra database
USE pharmat;

-- Kiểm tra tables
SHOW TABLES;
-- Expected: 10 tables

-- Kiểm tra dữ liệu mẫu
SELECT COUNT(*) FROM users;          -- Expected: 3
SELECT COUNT(*) FROM medicine_categories; -- Expected: 10
SELECT COUNT(*) FROM medicines;      -- Expected: 20
SELECT COUNT(*) FROM members;        -- Expected: 5

-- Kiểm tra indexes (should have 17+)
SELECT COUNT(*) FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'pharmat';

-- Kiểm tra critical indexes (performance optimization)
SELECT TABLE_NAME, INDEX_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'pharmat'
AND INDEX_NAME IN (
    'idx_order_items_order',
    'idx_order_items_medicine',
    'idx_orders_status_date',
    'idx_inventory_type_date'
);
-- Expected: 4 rows (these are critical for performance!)

-- Kiểm tra views
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
-- Expected: 5 views

-- Kiểm tra triggers
SHOW TRIGGERS;
-- Expected: 3 triggers
```

---

## 🔄 Update Database (Nếu Đã Có Database Cũ)

Nếu bạn đã có database `pharmat` từ trước và muốn update lên phiên bản mới:

### Option 1: Recreate (Mất Dữ Liệu)

```sql
DROP DATABASE IF EXISTS pharmat;
```

Sau đó chạy lại installation theo Cách 1 hoặc 2 ở trên.

### Option 2: Update Incremental (Giữ Dữ Liệu)

Chỉ chạy lại các file cần update:

```bash
# Update indexes (thêm indexes mới)
mysql -u root -p pharmat < database/03_create_indexes.sql

# Update triggers (fix duplicate alerts)
mysql -u root -p pharmat < database/06_create_triggers.sql
```

---

## 🛠️ Troubleshooting

### Lỗi: "Access denied for user 'root'@'localhost'"

**Giải pháp:**
- Kiểm tra password MySQL của bạn
- Thử thêm flag `-p` và nhập password khi được hỏi
- Nếu không có password: `mysql -u root < database/install.sql`

### Lỗi: "Can't connect to MySQL server"

**Giải pháp:**
- Đảm bảo MySQL/MariaDB đang chạy
- Mở XAMPP Control Panel → Start MySQL
- Hoặc: `net start mysql` (Windows)

### Lỗi: "Database exists"

**Giải pháp:**
```sql
DROP DATABASE pharmat;
```
Sau đó chạy lại installation.

### Lỗi: "Trigger already exists"

**Giải pháp:**
```sql
DROP TRIGGER IF EXISTS tr_inventory_update_stock;
DROP TRIGGER IF EXISTS tr_sale_update_stock;
DROP TRIGGER IF EXISTS tr_check_expiry_alert;
```
Sau đó chạy lại `06_create_triggers.sql`

### Performance vẫn chậm sau khi setup?

**Kiểm tra:**
1. Indexes đã được tạo đầy đủ chưa? (should have 17+ indexes)
   ```sql
   SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = 'pharmat';
   ```

2. Backend code đã update chưa?
   - File `backend/src/routes/sales.ts` phải có fix N+1 query problem

3. MySQL đang chạy trên production mode?
   - Check `my.ini` hoặc `my.cnf`

---

## 📚 Additional Resources

- **OPTIMIZATION_SUMMARY.md** - Chi tiết về các optimizations đã thực hiện
- **EXAMPLES.sql** - Ví dụ queries và use cases
- **install.sql** - Script tự động setup toàn bộ

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra phần Troubleshooting ở trên
2. Đọc file `OPTIMIZATION_SUMMARY.md` để hiểu cấu trúc database
3. Kiểm tra logs MySQL: `C:\xampp\mysql\data\*.err`

---

**Version:** 1.1 (Optimized)
**Last Updated:** 2025-10-31
**Status:** ✅ Production Ready

---

## 🎉 Quick Start Checklist

- [ ] MySQL đã chạy
- [ ] Chạy `mysql -u root -p < database/install.sql`
- [ ] Verify: `SELECT COUNT(*) FROM users;` → Result: 3
- [ ] Verify indexes: 17+ indexes
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Login: admin@pharmat.com / admin123
- [ ] Đổi password mặc định
- [ ] Ready to use! 🚀
