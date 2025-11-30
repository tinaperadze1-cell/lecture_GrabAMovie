const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { updateAllMoviePosters } = require("./realPosterService");

/**
 * Script to fetch REAL movie poster images (not placeholders)
 * Run with: npm run fetch-real-posters
 */

async function fetchAllRealPosters() {
  try {
    console.log("🎬 Starting REAL movie poster fetch...\n");
    
    const result = await updateAllMoviePosters(5, 2000);

    console.log("\n✅ Real poster fetch complete!");
    
    if (result.updated > 0) {
      console.log(`\n🎉 Successfully found ${result.updated} real movie posters!`);
      console.log("💡 Note: For more posters, consider getting a free TMDB API key at https://www.themoviedb.org/");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fetching real movie posters:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  fetchAllRealPosters();
}

module.exports = { fetchAllRealPosters };

