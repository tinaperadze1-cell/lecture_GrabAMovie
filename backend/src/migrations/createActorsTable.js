/**
 * Migration: Create movie_actors table
 * This table stores actors/cast information for movies
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

async function createActorsTable() {
  try {
    console.log("🔄 Creating movie_actors table...");

    // Create movie_actors table
    await query(`
      CREATE TABLE IF NOT EXISTS movie_actors (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        actor_name VARCHAR(255) NOT NULL,
        character_name VARCHAR(255),
        profile_photo_url VARCHAR(500),
        billing_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(movie_id, actor_name, character_name)
      )
    `);

    // Create index for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_movie_actors_movie_id 
      ON movie_actors(movie_id)
    `);

    // Create index for actor name searches
    await query(`
      CREATE INDEX IF NOT EXISTS idx_movie_actors_actor_name 
      ON movie_actors(actor_name)
    `);

    console.log("✅ movie_actors table created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating movie_actors table:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createActorsTable()
    .then(() => {
      console.log("\n🎉 Migration complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createActorsTable };

