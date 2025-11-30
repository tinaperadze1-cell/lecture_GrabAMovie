const { updateAllMoviePosters, getDailyRequestCount } = require("./posterService");

/**
 * Script to fetch movie posters from OMDB API for all movies missing posters
 * Run with: node src/fetchMoviePosters.js
 */

async function fetchAllPosters() {
  try {
    console.log("🎬 Fetching movie posters from OMDB API...\n");
    console.log(`📊 Current API usage today: ${getDailyRequestCount()}/900 requests\n`);

    const result = await updateAllMoviePosters(5, 2000, true); // Batch size 5, 2 second delay, force update ALL movies

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${result.updated} posters`);
    console.log(`❌ Failed: ${result.failed} posters`);
    console.log(`📈 Total processed: ${result.total || 0} movies`);
    console.log(`📊 API requests used: ${getDailyRequestCount()}/900\n`);

    if (result.errors && result.errors.length > 0) {
      console.log("⚠️  Errors encountered:");
      result.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. "${err.title || err.movieId}": ${err.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`   ... and ${result.errors.length - 10} more errors`);
      }
    }

    console.log("\n✅ Movie poster fetch complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fetching movie posters:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchAllPosters();
}

module.exports = { fetchAllPosters };

