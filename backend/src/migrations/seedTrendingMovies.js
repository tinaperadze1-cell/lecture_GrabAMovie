const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");
const { addTrendingMovie } = require("../trendingService");

/**
 * Seed initial trending movies for the voting system
 * Adds popular movies to get users started
 */
async function seedTrendingMovies() {
  try {
    console.log("🔄 Seeding initial trending movies...\n");

    // First, get some popular movies from the database
    // Try to find well-known movies by title or check for movies with IMDB ratings
    const popularMovieTitles = [
      "The Godfather",
      "Inception",
      "The Dark Knight",
      "Pulp Fiction",
      "Fight Club",
      "The Matrix",
      "Forrest Gump",
      "The Shawshank Redemption",
      "Titanic",
      "Avatar"
    ];

    let moviesAdded = 0;
    let moviesSkipped = 0;

    // Try to find each movie in the database
    for (const movieTitle of popularMovieTitles) {
      try {
        // Search for the movie by title (case-insensitive, partial match)
        const movieResult = await query(
          `SELECT id, title, poster_url 
           FROM movies 
           WHERE LOWER(title) LIKE LOWER($1) 
           LIMIT 1`,
          [`%${movieTitle}%`]
        );

        if (movieResult.rows.length > 0) {
          const movie = movieResult.rows[0];
          
          // Check if already in trending list
          const existing = await query(
            `SELECT id FROM trending_movies 
             WHERE movie_id = $1 OR LOWER(TRIM(title)) = LOWER(TRIM($2))`,
            [movie.id, movie.title]
          );

          if (existing.rows.length === 0) {
            // Add to trending list
            await addTrendingMovie(
              movie.id,
              movie.title,
              movie.poster_url || null,
              null // No specific user added it (system seed)
            );
            console.log(`✅ Added: "${movie.title}"`);
            moviesAdded++;
          } else {
            console.log(`⏭️  Skipped: "${movie.title}" (already exists)`);
            moviesSkipped++;
          }
        } else {
          console.log(`⚠️  Not found in database: "${movieTitle}"`);
        }
      } catch (error) {
        // If addTrendingMovie throws an error (e.g., duplicate), skip it
        if (error.message.includes("already in the trending list")) {
          console.log(`⏭️  Skipped: "${movieTitle}" (duplicate)`);
          moviesSkipped++;
        } else {
          console.error(`❌ Error adding "${movieTitle}":`, error.message);
        }
      }
    }

    // If we didn't find enough movies from the specific list, add some from the database
    if (moviesAdded < 5) {
      console.log(`\n📽️  Adding additional movies from database to reach 5+ movies...`);
      
      const additionalMovies = await query(
        `SELECT id, title, poster_url 
         FROM movies 
         WHERE id NOT IN (
           SELECT COALESCE(movie_id, 0) FROM trending_movies WHERE movie_id IS NOT NULL
           UNION
           SELECT -1 WHERE EXISTS (SELECT 1 FROM trending_movies WHERE movie_id IS NULL)
         )
         AND title IS NOT NULL 
         AND title != ''
         ORDER BY 
           CASE WHEN imdb_rating IS NOT NULL THEN imdb_rating ELSE 0 END DESC,
           year DESC
         LIMIT ${10 - moviesAdded}`
      );

      for (const movie of additionalMovies.rows) {
        try {
          const existing = await query(
            `SELECT id FROM trending_movies 
             WHERE movie_id = $1 OR LOWER(TRIM(title)) = LOWER(TRIM($2))`,
            [movie.id, movie.title]
          );

          if (existing.rows.length === 0) {
            await addTrendingMovie(
              movie.id,
              movie.title,
              movie.poster_url || null,
              null
            );
            console.log(`✅ Added: "${movie.title}"`);
            moviesAdded++;
          }
        } catch (error) {
          if (error.message.includes("already in the trending list")) {
            moviesSkipped++;
          }
        }
      }
    }

    console.log(`\n✅ Seeding completed:`);
    console.log(`   - Movies added: ${moviesAdded}`);
    console.log(`   - Movies skipped: ${moviesSkipped}`);
    
    if (moviesAdded >= 5) {
      console.log(`\n🎉 Successfully seeded ${moviesAdded} trending movies!`);
    } else {
      console.log(`\n⚠️  Only ${moviesAdded} movies were added. Make sure you have movies in your database.`);
    }

    return true;
  } catch (error) {
    console.error("❌ Error seeding trending movies:", error);
    throw error;
  }
}

if (require.main === module) {
  seedTrendingMovies()
    .then(() => {
      console.log("\n✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

module.exports = { seedTrendingMovies };



