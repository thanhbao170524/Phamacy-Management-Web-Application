@echo off
REM PharmaT Quick Database Setup Script for Windows

echo PharmaT Database Setup
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: MySQL is not installed or not in PATH.
    pause
    exit /b 1
)

REM Get database credentials
set /p DB_USER="MySQL username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD="MySQL password: "

echo.
echo Creating database...
mysql -u %DB_USER% -p%DB_PASSWORD% < 01_create_database.sql

echo Creating tables...
mysql -u %DB_USER% -p%DB_PASSWORD% < 02_create_tables.sql

echo Creating indexes...
mysql -u %DB_USER% -p%DB_PASSWORD% < 03_create_indexes.sql

echo Inserting seed data...
mysql -u %DB_USER% -p%DB_PASSWORD% < 04_seed_data.sql

echo Creating views...
mysql -u %DB_USER% -p%DB_PASSWORD% < 05_create_views.sql

echo Creating triggers...
mysql -u %DB_USER% -p%DB_PASSWORD% < 06_create_triggers.sql

echo.
echo Database setup completed successfully!
echo.
echo Test credentials:
echo   - Admin: admin@pharmat.com / password
echo   - Sales: sales@pharmat.com / password
echo   - Inventory: inventory@pharmat.com / password
echo.
pause

