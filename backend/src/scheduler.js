require("dotenv").config();
const cron = require("node-cron");
const { updateAllMovieRatings } = require("./imdbService");

/**
 * Scheduled Jobs for IMDB Rating Updates
 * Runs daily at 2 AM to update all movie ratings
 */

let isRunning = false;

/**
 * Job to update all IMDB ratings daily
 */
async function updateRatingsJob() {
  if (isRunning) {
    console.log("⏭️  Rating update job already running, skipping...");
    return;
  }

  isRunning = true;
  const startTime = new Date();

  try {
    console.log("🔄 Starting scheduled IMDB rating update...");
    console.log(`⏰ Time: ${startTime.toISOString()}`);

    const result = await updateAllMovieRatings(10, 2000);

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("✅ Rating update job completed!");
    console.log(`📊 Results: ${result.message}`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.slice(0, 5).forEach((err) => {
        console.log(`   - ${err.movie || err.message || "Unknown error"}`);
      });
    }
  } catch (error) {
    console.error("❌ Error in rating update job:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduler
 * Updates ratings daily at 2:00 AM
 */
function startScheduler() {
  // Schedule daily update at 2:00 AM
  // Cron format: minute hour day month weekday
  cron.schedule("0 2 * * *", () => {
    updateRatingsJob();
  });

  console.log("✅ IMDB rating scheduler started");
  console.log("📅 Daily updates scheduled for 2:00 AM");

  // Optional: Run immediately on startup (for testing)
  // Uncomment the line below to test
  // updateRatingsJob();
}

/**
 * Stop the scheduler (if needed)
 */
function stopScheduler() {
  // This would require storing the cron job reference
  // For now, we'll just log
  console.log("⏹️  Scheduler stop requested (implementation needed)");
}

module.exports = {
  startScheduler,
  stopScheduler,
  updateRatingsJob, // Export for manual triggering
};

