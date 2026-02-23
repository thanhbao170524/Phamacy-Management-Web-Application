import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pharmat",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Log config (without password) for debugging
console.log("📊 Database Config:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? "***" : "(empty)",
});

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Connected to MySQL database successfully!");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Database connection failed!");
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    console.error("\n💡 Troubleshooting tips:");
    console.error("1. Make sure MySQL is running in XAMPP");
    console.error("2. Check if database 'pharmat' exists");
    console.error("3. Verify DB credentials in backend/.env file");
    console.error("4. Try connecting manually: mysql -u root -p");
  });

export default pool;
