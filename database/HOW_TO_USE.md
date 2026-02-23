# Hướng Dẫn Sử Dụng Database PharmaT

## Cách Cài Đặt

### Bước 1: Chuẩn Bị MySQL

Đảm bảo bạn đã cài đặt MySQL:

```bash
# Kiểm tra MySQL
mysql --version
```

### Bước 2: Tạo Database

#### Cách 1: Chạy từng file (Khuyến nghị)

```bash
# Kết nối MySQL
mysql -u root -p

# Chạy từng file theo thứ tự
SOURCE database/01_create_database.sql;
SOURCE database/02_create_tables.sql;
SOURCE database/03_create_indexes.sql;
SOURCE database/04_seed_data.sql;
SOURCE database/05_create_views.sql;
SOURCE database/06_create_triggers.sql;
```

#### Cách 2: Chạy tất cả cùng lúc (Windows)

```bash
cd database
quick_setup.bat
```

#### Cách 3: Chạy tất cả cùng lúc (Linux/Mac)

```bash
cd database
chmod +x quick_setup.sh
./quick_setup.sh
```

### Bước 3: Kiểm Tra

```sql
USE pharmat;

-- Đếm số bảng
SHOW TABLES;

-- Kiểm tra dữ liệu
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM medicines;
SELECT COUNT(*) FROM medicine_categories;
SELECT COUNT(*) FROM members;
```

## Cấu Hình Backend

### Bước 1: Tạo file .env

```bash
cd backend
cp .env.example .env
```

### Bước 2: Chỉnh sửa .env

```env
PORT=5000
JWT_SECRET=your-secret-key-here

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pharmat
```

### Bước 3: Cài đặt dependencies

```bash
cd backend
npm install
```

### Bước 4: Chạy backend

```bash
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

## Tài Khoản Demo

Sau khi chạy seed data, bạn sẽ có các tài khoản:

| Role            | Email                 | Password |
| --------------- | --------------------- | -------- |
| Admin           | admin@pharmat.com     | password |
| Sales Staff     | sales@pharmat.com     | password |
| Inventory Staff | inventory@pharmat.com | password |

## Kiểm Tra Backend

```bash
# Health check
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pharmat.com","password":"password"}'
```

## Xóa và Cài Lại

```sql
DROP DATABASE IF EXISTS pharmat;
-- Sau đó chạy lại các file setup
```

## Troubleshooting

### Lỗi: "Can't connect to MySQL server"

- Kiểm tra MySQL đang chạy: `sudo service mysql status`
- Start MySQL: `sudo service mysql start`

### Lỗi: "Access denied for user"

- Kiểm tra username/password trong file .env
- Đảm bảo user có quyền tạo database

### Lỗi: "Table already exists"

```sql
USE pharmat;
DROP TABLE IF EXISTS notifications, alerts, order_items, orders, members,
inventory_records, medicines, medicine_categories, settings, users;
-- Chạy lại file setup
```

## Backup Dữ Liệu

```bash
# Backup toàn bộ database
mysqldump -u root -p pharmat > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p pharmat < backup_YYYYMMDD.sql
```
