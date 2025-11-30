const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");
const { query } = require("./db");

/**
 * Real Movie Poster Service
 * Fetches actual movie poster images using multiple free sources
 */

/**
 * Get real movie poster using OMDb API (works for real movies)
 * Uses the OMDB API key from environment or fallback
 */
async function getPosterFromOMDB(title, year) {
  try {
    const OMDB_API_KEY = process.env.OMDB_API_KEY || "ca478e54";
    
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        t: title,
        y: year || undefined,
        apikey: OMDB_API_KEY,
        type: "movie",
        r: "json",
      },
      timeout: 8000,
    });

    if (response.data && response.data.Response === "True" && response.data.Poster && response.data.Poster !== "N/A" && response.data.Poster.startsWith("http")) {
      return response.data.Poster;
    }
  } catch (error) {
    // Silently fail and try other methods
    console.error(`OMDB error for "${title}":`, error.message);
  }
  return null;
}

/**
 * Get poster using a movie poster database API (no auth needed for some services)
 */
async function getPosterFromMovieDB(title, year) {
  try {
    // Use a public movie poster lookup service
    // This uses a service that provides movie posters
    const searchQuery = `${title} ${year}`;
    
    // Try using TMDB's public image CDN if we can guess the path
    // Or use a movie poster aggregator service
    
    // Alternative: Use Google Custom Search (free tier) or similar
    // For now, we'll use a pattern-based approach for known movies
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Use a movie poster service that works without API key
 * For popular movies, we can construct URLs directly
 */
function getKnownMoviePoster(title, year) {
  // Load comprehensive poster database
  try {
    const { MOVIE_POSTERS } = require("./moviePostersDB");
    return MOVIE_POSTERS[title] || null;
  } catch (error) {
    // Fallback to hardcoded list if module fails
    const knownMovies = {
      "The Shawshank Redemption": "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
      "The Godfather": "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
      "The Dark Knight": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
      "Pulp Fiction": "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3Yz5NTJlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
      "Inception": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
      "The Matrix": "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
      "Interstellar": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    };
    return knownMovies[title] || null;
  }
}

/**
 * Main function to get real movie poster
 */
async function getRealMoviePoster(title, year) {
  // Strategy 1: Check known movies
  const knownPoster = getKnownMoviePoster(title, year);
  if (knownPoster) {
    return knownPoster;
  }

  // Strategy 2: Try OMDb (might work for real movies)
  const omdbPoster = await getPosterFromOMDB(title, year);
  if (omdbPoster) {
    return omdbPoster;
  }

  // Strategy 3: Use a movie poster service URL pattern
  // For real movies, we can try to construct poster URLs
  // This uses the pattern: base URL + encoded title
  
  return null;
}

/**
 * Update movie poster in database
 */
async function updateMoviePoster(movieId, title, year) {
  try {
    const posterUrl = await getRealMoviePoster(title, year);
    
    if (posterUrl) {
      await query(
        "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [posterUrl, movieId]
      );
      return {
        success: true,
        posterUrl: posterUrl,
        error: null,
      };
    }

    // If no real poster found, return failure
    return {
      success: false,
      posterUrl: null,
      error: "No real poster found",
    };
  } catch (error) {
    console.error(`Error updating poster for ${title}:`, error.message);
    return {
      success: false,
      posterUrl: null,
      error: error.message,
    };
  }
}

/**
 * Update all movie posters with real images
 */
async function updateAllMoviePosters(batchSize = 5, delayMs = 2000) {
  try {
    const moviesResult = await query(
      `SELECT id, title, year, poster_url 
       FROM movies 
       ORDER BY id`
    );

    const movies = moviesResult.rows;
    let updated = 0;
    let failed = 0;
    const errors = [];

    console.log(`🎬 Fetching REAL movie posters for ${movies.length} movies...\n`);

    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}...`);

      for (const movie of batch) {
        console.log(`  🔍 Fetching poster for: "${movie.title}" (${movie.year})...`);
        
        const result = await updateMoviePoster(movie.id, movie.title, movie.year);
        
        if (result.success) {
          console.log(`  ✅ Found real poster: ${result.posterUrl.substring(0, 60)}...`);
          updated++;
        } else {
          console.log(`  ⚠️  No real poster found (will keep existing or skip)`);
          failed++;
          errors.push({ movieId: movie.id, title: movie.title, error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (i + batchSize < movies.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully found real posters: ${updated}`);
    console.log(`⚠️  No real poster found: ${failed}`);
    console.log(`📈 Total processed: ${movies.length}\n`);

    return {
      updated,
      failed,
      errors,
      total: movies.length,
    };
  } catch (error) {
    console.error("Error updating posters:", error);
    return {
      updated: 0,
      failed: 0,
      errors: [{ error: error.message }],
      total: 0,
    };
  }
}

module.exports = {
  getRealMoviePoster,
  updateMoviePoster,
  updateAllMoviePosters,
};

