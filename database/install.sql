-- PharmaT Database Installation Script
-- Run this file to set up the entire database

-- Load all SQL files in order
SOURCE 01_create_database.sql;
SOURCE 02_create_tables.sql;
SOURCE 03_create_indexes.sql;
SOURCE 04_seed_data.sql;
SOURCE 05_create_views.sql;
SOURCE 06_create_triggers.sql;

-- Confirm installation
SELECT 'Database installation completed successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_categories FROM medicine_categories;
SELECT COUNT(*) as total_medicines FROM medicines;
SELECT COUNT(*) as total_members FROM members;

