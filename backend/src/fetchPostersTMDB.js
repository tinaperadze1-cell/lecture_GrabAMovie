const { updateAllMoviePosters } = require("./tmdbPosterService");

/**
 * Script to fetch movie posters using TMDB API
 */

async function fetchAllPosters() {
  try {
    console.log("🎬 Fetching movie posters...\n");

    const result = await updateAllMoviePosters(10, 1000);

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${result.updated} posters`);
    console.log(`❌ Failed: ${result.failed} posters`);
    console.log(`📈 Total processed: ${result.total} movies\n`);

    console.log("✅ Movie poster fetch complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fetching movie posters:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  fetchAllPosters();
}

module.exports = { fetchAllPosters };

