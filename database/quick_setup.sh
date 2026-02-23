#!/bin/bash

# PharmaT Quick Database Setup Script

echo "🚀 Starting PharmaT Database Setup..."
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Get database credentials
read -p "MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL password: " DB_PASSWORD
echo ""

# Create database
echo "📦 Creating database..."
mysql -u $DB_USER -p$DB_PASSWORD < 01_create_database.sql

# Create tables
echo "📊 Creating tables..."
mysql -u $DB_USER -p$DB_PASSWORD < 02_create_tables.sql

# Create indexes
echo "🔍 Creating indexes..."
mysql -u $DB_USER -p$DB_PASSWORD < 03_create_indexes.sql

# Insert seed data
echo "🌱 Inserting seed data..."
mysql -u $DB_USER -p$DB_PASSWORD < 04_seed_data.sql

# Create views
echo "👁️ Creating views..."
mysql -u $DB_USER -p$DB_PASSWORD < 05_create_views.sql

# Create triggers
echo "⚙️ Creating triggers..."
mysql -u $DB_USER -p$DB_PASSWORD < 06_create_triggers.sql

echo ""
echo "✅ Database setup completed successfully!"
echo ""
echo "📋 Test credentials:"
echo "   - Admin: admin@pharmat.com / password"
echo "   - Sales: sales@pharmat.com / password"
echo "   - Inventory: inventory@pharmat.com / password"
echo ""
echo "🎉 You can now start the backend server!"

