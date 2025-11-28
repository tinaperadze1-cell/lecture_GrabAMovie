const { Pool } = require("pg");

// PostgreSQL connection string from Neon
const connectionString =
  "postgresql://neondb_owner:npg_K4XC5waWMOyp@ep-steep-wind-agomrvf6-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Create a connection pool (reuses connections efficiently)
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

// Test the connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms: ${text.substring(0, 50)}...`);
    return res;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
};

module.exports = { pool, query };

