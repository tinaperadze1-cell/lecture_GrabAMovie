require("dotenv").config();
const { updateAllMovieRatings, getDailyRequestCount } = require("./imdbService");

/**
 * Script to fetch IMDB ratings from OMDB API for all movies
 * Run this after setting up your OMDB_API_KEY in .env file
 */
async function fetchAllRatings() {
  try {
    console.log("🎬 Fetching IMDB ratings from OMDB API...");
    console.log("=" .repeat(60));

    // Check API key
    if (!process.env.OMDB_API_KEY || process.env.OMDB_API_KEY === "demo") {
      console.error("\n❌ OMDB_API_KEY not configured!");
      console.log("\n📝 To get a free API key:");
      console.log("   1. Visit: http://www.omdbapi.com/apikey.aspx");
      console.log("   2. Choose FREE tier (1,000 requests/day)");
      console.log("   3. Enter your email and activate via email link");
      console.log("   4. Add to backend/.env file: OMDB_API_KEY=your_key_here");
      console.log("\n💡 See backend/IMDB_SETUP.md for detailed instructions");
      process.exit(1);
    }

    // Show current stats
    const stats = getDailyRequestCount();
    console.log(`\n📊 API Usage: ${stats.count}/${stats.limit} requests today`);
    console.log(`   Remaining: ${stats.remaining} requests\n`);

    // Fetch ratings (force update all movies)
    console.log("🔄 Fetching ratings for all movies...\n");
    const result = await updateAllMovieRatings(10, 2000, true);

    console.log("\n" + "=".repeat(60));
    console.log("✅ IMDB rating fetch complete!");
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Updated: ${result.updated} movies`);
    console.log(`   ❌ Failed: ${result.failed} movies`);
    console.log(`   📝 Total processed: ${result.total || result.updated + result.failed}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
      if (result.errors.length <= 10) {
        result.errors.forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err.movie || err.message || "Unknown error"}`);
        });
      } else {
        console.log("   (First 10 errors shown)");
        result.errors.slice(0, 10).forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err.movie || err.message || "Unknown error"}`);
        });
      }
    }

    // Show final stats
    const finalStats = getDailyRequestCount();
    console.log(`\n📊 Final API Usage: ${finalStats.count}/${finalStats.limit} requests`);
    console.log(`   Remaining: ${finalStats.remaining} requests`);

    console.log("\n💡 Ratings are now stored in Neon database");
    console.log("   They will update automatically daily at 2:00 AM");

  } catch (error) {
    console.error("\n❌ Error fetching IMDB ratings:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchAllRatings()
    .then(() => {
      console.log("\n🎉 Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error);
      process.exit(1);
    });
}

module.exports = { fetchAllRatings };

