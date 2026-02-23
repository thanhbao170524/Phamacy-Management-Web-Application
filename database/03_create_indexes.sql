USE pharmat;

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

