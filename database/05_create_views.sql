USE pharmat;

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

