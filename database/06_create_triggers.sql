USE pharmat;

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

