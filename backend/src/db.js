const { Pool } = require("pg");

// PostgreSQL connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a connection pool (reuses connections efficiently)
// SSL configuration: use SSL in production (Google Cloud SQL), optional in development
const poolConfig = {
  connectionString,
};

// Enable SSL for production (Google Cloud SQL requires SSL)
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: false, // Required for Google Cloud SQL and Neon
  };
} else if (connectionString && connectionString.includes('sslmode=require')) {
  // If connection string explicitly requires SSL
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

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

