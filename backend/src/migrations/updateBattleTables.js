const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Update battle tables to match the required structure
 * Creates movie_battle_history table if it doesn't exist
 */
async function updateBattleTables() {
  try {
    console.log("🔄 Updating Movie Battle tables...");

    // Create movie_battle_history table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS movie_battle_history (
        id SERIAL PRIMARY KEY,
        movie_a_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        movie_b_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        winner_id INTEGER REFERENCES movies(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        votes_a INTEGER DEFAULT 0,
        votes_b INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ movie_battle_history table created");

    // Ensure movie_battle_stats has monthly_wins column
    try {
      await query(`ALTER TABLE movie_battle_stats ADD COLUMN IF NOT EXISTS monthly_wins INTEGER DEFAULT 0`);
      console.log("✅ movie_battle_stats updated with monthly_wins column");
    } catch (error) {
      console.log("ℹ️  movie_battle_stats columns check completed");
    }

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_battle_history_date ON movie_battle_history(date);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_battle_history_winner ON movie_battle_history(winner_id);
    `);
    console.log("✅ Indexes created for battle history table");

    console.log("✅ Movie Battle tables updated successfully");
    return true;
  } catch (error) {
    console.error("❌ Error updating Movie Battle tables:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateBattleTables()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { updateBattleTables };

