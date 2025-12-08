const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Remove duplicate entries from trending_movies table
 * Keeps the entry with the most votes, or the oldest one if votes are equal
 */
async function removeDuplicateTrendingMovies() {
  try {
    console.log("🔄 Removing duplicate trending movies...\n");

    // Find duplicates by movie_id (keeping the one with most votes)
    const duplicatesByMovieId = await query(`
      SELECT 
        movie_id,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY votes DESC, created_at ASC) as ids
      FROM trending_movies
      WHERE movie_id IS NOT NULL
      GROUP BY movie_id
      HAVING COUNT(*) > 1
    `);

    console.log(`Found ${duplicatesByMovieId.rows.length} duplicates by movie_id`);

    for (const dup of duplicatesByMovieId.rows) {
      const ids = dup.ids;
      const keepId = ids[0]; // Keep the first one (most votes or oldest)
      const deleteIds = ids.slice(1); // Delete the rest

      console.log(`Movie ID ${dup.movie_id}: Keeping ID ${keepId}, deleting IDs ${deleteIds.join(', ')}`);

      // Delete votes associated with duplicate entries
      for (const deleteId of deleteIds) {
        await query(`DELETE FROM trending_votes WHERE movie_id = $1`, [deleteId]);
      }

      // Delete duplicate entries
      await query(`DELETE FROM trending_movies WHERE id = ANY($1)`, [deleteIds]);
    }

    // Find duplicates by title (case-insensitive, keeping the one with most votes)
    const duplicatesByTitle = await query(`
      SELECT 
        LOWER(TRIM(title)) as normalized_title,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY votes DESC, created_at ASC) as ids,
        ARRAY_AGG(title) as titles
      FROM trending_movies
      GROUP BY LOWER(TRIM(title))
      HAVING COUNT(*) > 1
    `);

    console.log(`\nFound ${duplicatesByTitle.rows.length} duplicates by title`);

    for (const dup of duplicatesByTitle.rows) {
      const ids = dup.ids;
      const keepId = ids[0]; // Keep the first one (most votes or oldest)
      const deleteIds = ids.slice(1); // Delete the rest

      console.log(`Title "${dup.titles[0]}": Keeping ID ${keepId}, deleting IDs ${deleteIds.join(', ')}`);

      // Delete votes associated with duplicate entries
      for (const deleteId of deleteIds) {
        await query(`DELETE FROM trending_votes WHERE movie_id = $1`, [deleteId]);
      }

      // Delete duplicate entries
      await query(`DELETE FROM trending_movies WHERE id = ANY($1)`, [deleteIds]);
    }

    // Ensure UNIQUE constraint exists
    try {
      await query(`
        ALTER TABLE trending_movies 
        ADD CONSTRAINT unique_trending_movie_id 
        UNIQUE (movie_id)
      `);
      console.log("\n✅ Unique constraint on movie_id enforced");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("\n✅ Unique constraint on movie_id already exists");
      } else {
        console.log("\n⚠️  Could not add unique constraint:", error.message);
      }
    }

    console.log("\n✅ Duplicate removal completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error removing duplicates:", error);
    throw error;
  }
}

if (require.main === module) {
  removeDuplicateTrendingMovies()
    .then(() => {
      console.log("✅ Cleanup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cleanup failed:", error);
      process.exit(1);
    });
}

module.exports = { removeDuplicateTrendingMovies };



