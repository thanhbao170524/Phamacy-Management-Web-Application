# Hướng Dẫn Setup Hệ Thống PharmaT

## Tổng Quan

Hệ thống PharmaT bao gồm:

- **Frontend**: Vue 3 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL với 10 bảng chính

## Bước 1: Cài Đặt Frontend

### 1.1 Cài đặt dependencies

```bash
npm install
```

### 1.2 Chạy development server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Bước 2: Setup Database MySQL

### 2.1 Chạy script tạo database

**Windows:**

```bash
cd database
quick_setup.bat
```

**Linux/Mac:**

```bash
cd database
chmod +x quick_setup.sh
./quick_setup.sh
```

**Hoặc chạy từng file trong MySQL:**

```bash
mysql -u root -p < database/01_create_database.sql
mysql -u root -p < database/02_create_tables.sql
mysql -u root -p < database/03_create_indexes.sql
mysql -u root -p < database/04_seed_data.sql
mysql -u root -p < database/05_create_views.sql
mysql -u root -p < database/06_create_triggers.sql
```

### 2.2 Verify database

```sql
USE pharmat;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM medicines;
```

## Bước 3: Setup Backend

### 3.1 Tạo file .env

```bash
cd backend
cp .env.example .env
```

### 3.2 Chỉnh sửa .env

```env
PORT=5000
JWT_SECRET=your-secret-key-here

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pharmat
```

### 3.3 Cài đặt dependencies

```bash
cd backend
npm install
```

### 3.4 Chạy backend

```bash
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

## Bước 4: Truy Cập Hệ Thống

### 4.1 Mở trình duyệt

```
http://localhost:3000
```

### 4.2 Đăng nhập

Có 3 tài khoản demo:

| Vai Trò               | Email                 | Password |
| --------------------- | --------------------- | -------- |
| Admin                 | admin@pharmat.com     | password |
| Nhân viên bán hàng    | sales@pharmat.com     | password |
| Nhân viên quản lý kho | inventory@pharmat.com | password |

## Cấu Trúc Database

### Các Bảng Chính

1. **users** - Nhân viên (Admin, Sales, Inventory)
2. **medicine_categories** - Danh mục thuốc
3. **medicines** - Thông tin thuốc
4. **inventory_records** - Lịch sử nhập xuất
5. **members** - Thành viên/khách hàng
6. **orders** - Đơn hàng
7. **order_items** - Chi tiết đơn hàng
8. **alerts** - Cảnh báo hệ thống
9. **settings** - Cài đặt hệ thống
10. **notifications** - Thông báo người dùng

### Views Hữu Ích

- `v_top_selling_medicines` - Top thuốc bán chạy
- `v_expiring_medicines` - Thuốc sắp hết hạn
- `v_low_stock_medicines` - Thuốc sắp hết
- `v_daily_sales` - Thống kê doanh thu theo ngày
- `v_staff_performance` - Hiệu suất nhân viên

### Triggers Tự Động

1. **tr_inventory_update_stock** - Cập nhật tồn kho khi nhập/xuất
2. **tr_sale_update_stock** - Cập nhật tồn kho khi bán hàng
3. **tr_check_expiry_alert** - Tự động tạo cảnh báo hết hạn/hết hàng

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/verify` - Xác thực token

### Medicines

- `GET /api/medicines` - Lấy danh sách thuốc
- `GET /api/medicines/:id` - Lấy chi tiết thuốc
- `POST /api/medicines` - Tạo thuốc mới
- `PUT /api/medicines/:id` - Cập nhật thuốc
- `DELETE /api/medicines/:id` - Xóa thuốc

### Other Endpoints (Mock Data)

- Inventory, Sales, Staff, Members routes vẫn dùng mock data
- Có thể update sau khi có thời gian

## Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pharmat.com","password":"password"}'

# Get medicines
curl http://localhost:5000/api/medicines
```

## Reset Database

```bash
# Xóa database
mysql -u root -p -e "DROP DATABASE IF EXISTS pharmat;"

# Tạo lại
cd database
# Chạy lại quick_setup script
```

## Troubleshooting

### Frontend không kết nối được backend

Kiểm tra file `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

### Backend không kết nối được database

1. Kiểm tra MySQL đang chạy:

```bash
sudo service mysql status
# or
mysql -u root -p
```

2. Kiểm tra file `.env` trong `backend/`

3. Test kết nối:

```sql
mysql -u root -p pharmat
SHOW TABLES;
```

### Lỗi "Module not found"

```bash
# Reinstall dependencies
npm install
cd backend && npm install
```

## Next Steps

1. ✅ Database đã được tạo với trigger và view
2. ✅ Backend auth và medicines đã kết nối MySQL
3. ⏳ Cần update các routes khác (inventory, sales, staff, members) để kết nối MySQL
4. ⏳ Cần tạo CRUD operations hoàn chỉnh cho tất cả modules

## Liên Hệ

- Email: support@pharmat.com
- Documentation: Xem trong folder `database/`
