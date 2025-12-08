const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Create all tables needed for the Movie Battle system
 */
async function createBattleTables() {
  try {
    console.log("🔄 Creating Movie Battle system tables...");

    // Create movie_battles table (daily battles)
    await query(`
      CREATE TABLE IF NOT EXISTS movie_battles (
        id SERIAL PRIMARY KEY,
        movie1_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        movie2_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
        movie1_votes INTEGER DEFAULT 0,
        movie2_votes INTEGER DEFAULT 0,
        winner_id INTEGER REFERENCES movies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(battle_date)
      )
    `);
    console.log("✅ movie_battles table created");

    // Create battle_votes table (individual user votes)
    await query(`
      CREATE TABLE IF NOT EXISTS battle_votes (
        id SERIAL PRIMARY KEY,
        battle_id INTEGER NOT NULL REFERENCES movie_battles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        voted_for_movie_id INTEGER NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(battle_id, user_id)
      )
    `);
    console.log("✅ battle_votes table created");

    // Create movie_battle_stats table (aggregated stats)
    await query(`
      CREATE TABLE IF NOT EXISTS movie_battle_stats (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        battles_won INTEGER DEFAULT 0,
        battles_lost INTEGER DEFAULT 0,
        total_votes_received INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(movie_id)
      )
    `);
    console.log("✅ movie_battle_stats table created");

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_battles_date ON movie_battles(battle_date);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_battles_winner ON movie_battles(winner_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_votes_battle ON battle_votes(battle_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_votes_user ON battle_votes(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_stats_movie ON movie_battle_stats(movie_id);
    `);
    console.log("✅ Indexes created for battle tables");

    console.log("✅ Movie Battle tables created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating Movie Battle tables:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createBattleTables()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createBattleTables };

