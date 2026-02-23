# Phân Tích Phân Quyền Hiện Tại vs Yêu Cầu

## ✅ Phân Quyền Đúng

### Admin (Chủ tiệm thuốc)
- ✅ Quản lý danh mục (Categories) - Route: admin, inventory_staff
- ✅ Quản lý thuốc (Medicines) - Route: admin, inventory_staff  
- ✅ Quản lý kho (Inventory) - Route: admin, inventory_staff
- ✅ Tạo và quản lý đơn hàng (Sales) - Route: admin, sales_staff
- ✅ Báo cáo (Reports) - Route: admin only
- ✅ Quản lý nhân viên (Staff) - Route: admin only
- ✅ Quản lý thành viên (Members) - Route: admin, sales_staff
- ✅ Cảnh báo (Alerts) - Route: all roles
- ✅ Cài đặt (Settings) - Route: admin only

### Inventory Staff (Nhân viên quản lý kho)
- ✅ Quản lý danh mục - Route: admin, inventory_staff
- ✅ Quản lý thuốc - Route: admin, inventory_staff
- ✅ Quản lý kho - Route: admin, inventory_staff
- ✅ Xem cảnh báo - Route: all roles

## ❌ Vấn Đề Cần Sửa

### 1. Sales Staff - Thiếu Quyền XEM Thuốc
**Yêu cầu:** Tìm kiếm và xem thông tin thuốc trong kho (không chỉnh sửa)

**Hiện tại:**
- ❌ Router không cho Sales Staff truy cập `/medicines`
- ❌ Sidebar không hiển thị menu Medicines cho Sales Staff
- ✅ Backend API GET `/api/medicines` có authenticateToken (Sales Staff có thể gọi được)

**Cần sửa:**
- Thêm route `/medicines` cho Sales Staff với quyền CHỈ XEM
- Thêm menu Medicines vào Sidebar cho Sales Staff
- Ẩn nút "Thêm Thuốc Mới" và các nút sửa/xóa trong MedicinesView cho Sales Staff

### 2. Sales Staff - Xem Tất Cả Đơn Hàng
**Yêu cầu:** Xem lịch sử giao dịch do chính mình xử lý

**Hiện tại:**
- ❌ Backend API GET `/api/sales` trả về TẤT CẢ đơn hàng, không filter theo staff_id
- ❌ Sales Staff có thể xem đơn hàng của nhân viên khác

**Cần sửa:**
- Backend: Filter đơn hàng theo `staff_id` nếu user là sales_staff
- Chỉ Admin mới xem được tất cả đơn hàng

### 3. Inventory Staff - Có Menu Reports
**Yêu cầu:** Không có yêu cầu xem báo cáo cho Inventory Staff

**Hiện tại:**
- ❌ Sidebar hiển thị Reports cho Inventory Staff
- ❌ Router không cho Inventory Staff truy cập `/reports` (đúng)
- ⚠️ Có sự không nhất quán giữa Sidebar và Router

**Cần sửa:**
- Xóa Reports khỏi Sidebar cho Inventory Staff

### 4. Sales Staff - Quản Lý Đơn Hàng
**Yêu cầu:** Tạo đơn thuốc, quản lý đơn và thanh toán

**Hiện tại:**
- ✅ Có route `/sales` cho Sales Staff
- ✅ Backend API POST `/api/sales` cho phép tạo đơn
- ✅ Backend API PUT `/api/sales/:id` cho phép sửa đơn
- ✅ Có đầy đủ chức năng

**Vấn đề nhỏ:**
- Sales Staff có thể sửa đơn hàng của nhân viên khác không? (Cần kiểm tra)

## 📋 Tổng Kết Vấn Đề

| Vấn Đề | Mức Độ | Ảnh Hưởng |
|--------|--------|-----------|
| Sales Staff không xem được thuốc | 🔴 Nghiêm trọng | Không thể bán hàng hiệu quả |
| Sales Staff xem được đơn hàng của người khác | 🟡 Trung bình | Vi phạm quyền riêng tư |
| Inventory Staff thấy menu Reports | 🟢 Nhỏ | Gây nhầm lẫn UI |

## 🔧 Kế Hoạch Sửa

1. **Sửa Router:** Thêm `/medicines` cho Sales Staff (chỉ xem)
2. **Sửa Sidebar:** Thêm Medicines cho Sales Staff, xóa Reports cho Inventory Staff
3. **Sửa MedicinesView:** Ẩn nút thêm/sửa/xóa cho Sales Staff
4. **Sửa Backend Sales Route:** Filter theo staff_id nếu là sales_staff
5. **Kiểm tra Backend Medicines Route:** Đảm bảo Sales Staff chỉ có thể GET, không POST/PUT/DELETE

