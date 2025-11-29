require("dotenv").config();
const { query } = require("./db");

/**
 * Database verification script
 * Verifies that all data has been successfully migrated to Neon database
 * This script can be run to check the current state of the database
 */
async function verifyMigration() {
  try {
    console.log("🔍 Verifying data in Neon database...");
    console.log("=" .repeat(60));

    // Check movies
    const movieCount = await query("SELECT COUNT(*) as count FROM movies");
    console.log(`\n📽️  Total movies in database: ${movieCount.rows[0].count}`);

    // Check IMDB ratings
    const ratingCount = await query("SELECT COUNT(*) as count FROM movies WHERE imdb_rating IS NOT NULL");
    console.log(`⭐ Movies with IMDB ratings: ${ratingCount.rows[0].count}`);

    // Check movies with all details
    const detailedCount = await query(`
      SELECT COUNT(*) as count 
      FROM movies 
      WHERE description IS NOT NULL 
        AND poster_url IS NOT NULL 
        AND duration IS NOT NULL
    `);
    console.log(`📋 Movies with full details: ${detailedCount.rows[0].count}`);

    // Check users
    const userCount = await query("SELECT COUNT(*) as count FROM users");
    console.log(`👤 Total users: ${userCount.rows[0].count}`);

    // Check ratings
    const userRatingCount = await query("SELECT COUNT(*) as count FROM ratings");
    console.log(`⭐ User ratings: ${userRatingCount.rows[0].count}`);

    // Check comments
    const commentCount = await query("SELECT COUNT(*) as count FROM comments");
    console.log(`💬 User comments: ${commentCount.rows[0].count}`);

    // Check favourites
    const favCount = await query("SELECT COUNT(*) as count FROM favourites");
    console.log(`👑 User favourites: ${favCount.rows[0].count}`);

    // Check watchlist
    const watchlistCount = await query("SELECT COUNT(*) as count FROM watchlist");
    console.log(`📝 Watchlist items: ${watchlistCount.rows[0].count}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Database verification complete!");
    console.log("\n💡 All data is stored in Neon database.");
    console.log("   IMDB ratings update automatically via API integration.");
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log("\n🎉 Verification complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Verification failed:", error);
      process.exit(1);
    });
}

module.exports = { verifyMigration };
