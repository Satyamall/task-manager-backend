// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 5432,
//   connectionTimeoutMillis: 30000, // 30 seconds
//   ssl: { rejectUnauthorized: false }, // For Supabase
// });

// pool.on("connect", () => {
//   console.log("Connected to Supabase:", {
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//   });
// });

// pool.on("error", (err) => {
//   console.error("Database Pool Error:", err);
// });

// module.exports = pool;
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT ||
  !process.env.CA_CERT_PATH
) {
  throw new Error("Missing required database environment variables");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync(process.env.CA_CERT_PATH),
  },
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to Aiven MySQL:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT
      )
    `);
    console.log("Users table created or already exists");

    // Create tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("Tasks table created or already exists");

    connection.release();
  } catch (err) {
    console.error("Database Initialization Error:", err);
    throw err;
  }
}

initializeDatabase().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

module.exports = pool;
