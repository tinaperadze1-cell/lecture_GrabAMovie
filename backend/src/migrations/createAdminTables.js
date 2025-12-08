const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Create admin-related database tables and columns
 * Adds: is_admin, is_banned, flagged_comments, user_warnings
 */
async function createAdminTables() {
  try {
    console.log("🔄 Creating admin system tables and columns...");

    // Add admin and ban columns to users table
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT`);
      console.log("✅ Users table updated with admin/ban columns");
    } catch (error) {
      console.log("ℹ️  Users table columns check completed");
    }

    // Add flagged and moderation columns to comments table
    try {
      await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false`);
      await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS flagged_reason TEXT`);
      await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS original_text TEXT`);
      await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id)`);
      await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP`);
      console.log("✅ Comments table updated with moderation columns");
    } catch (error) {
      console.log("ℹ️  Comments table columns check completed");
    }

    // Create user_warnings table
    await query(`
      CREATE TABLE IF NOT EXISTS user_warnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        warning_reason TEXT NOT NULL,
        warned_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ User warnings table created/verified");

    // Create admin_logs table for tracking admin actions
    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        target_type VARCHAR(100),
        target_id INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Admin logs table created/verified");

    // Create a default admin user if no admin exists
    const adminCheck = await query("SELECT COUNT(*) FROM users WHERE is_admin = true");
    if (adminCheck.rows[0].count === "0") {
      // Check if 'admin' user exists
      const adminUser = await query("SELECT id FROM users WHERE username = 'admin'");
      if (adminUser.rows.length > 0) {
        // Make existing admin user an admin
        await query("UPDATE users SET is_admin = true WHERE username = 'admin'");
        console.log("✅ Made existing 'admin' user an administrator");
      } else {
        // Create new admin user
        await query(
          "INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)",
          ["admin", "admin123", true]
        );
        console.log("✅ Created default admin user (username: admin, password: admin123)");
        console.log("⚠️  WARNING: Please change the admin password immediately!");
      }
    }

    console.log("🎉 Admin system tables and columns created successfully!");
  } catch (error) {
    console.error("❌ Admin system creation failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminTables()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      process.exit(1);
    });
}

module.exports = { createAdminTables };

