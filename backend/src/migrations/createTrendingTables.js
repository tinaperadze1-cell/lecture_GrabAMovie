const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Create all tables needed for the Trending & Popular Voting system
 */
async function createTrendingTables() {
  try {
    console.log("🔄 Creating Trending & Popular Voting system tables...");

    // Create trending_movies table (movies available for voting)
    await query(`
      CREATE TABLE IF NOT EXISTS trending_movies (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        poster_url VARCHAR(500),
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(movie_id)
      )
    `);
    console.log("✅ trending_movies table created");

    // Create trending_votes table (individual user votes)
    await query(`
      CREATE TABLE IF NOT EXISTS trending_votes (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES trending_movies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        vote_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        month VARCHAR(7) NOT NULL,
        UNIQUE(movie_id, user_id, month)
      )
    `);
    console.log("✅ trending_votes table created");

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trending_movies_votes ON trending_movies(votes DESC);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trending_movies_created ON trending_movies(created_at DESC);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trending_votes_user ON trending_votes(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trending_votes_month ON trending_votes(month);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trending_votes_movie_month ON trending_votes(movie_id, month);
    `);
    console.log("✅ Indexes created for trending tables");

    console.log("✅ Trending & Popular Voting tables created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating Trending & Popular Voting tables:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTrendingTables()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createTrendingTables };

