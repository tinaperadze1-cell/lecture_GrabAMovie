const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");
const { query } = require("./db");

/**
 * Movie Poster Service using OMDB API
 * Fetches poster URLs for movies that don't have them
 */

const OMDB_API_KEY = process.env.OMDB_API_KEY || "ca478e54";
const OMDB_API_URL = "http://www.omdbapi.com/";

// TMDB API for better poster quality (real movie posters)
const TMDB_API_KEY = process.env.TMDB_API_KEY || null;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Rate limiting: track requests
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();
const MAX_DAILY_REQUESTS = 900; // Leave buffer under 1000 limit

/**
 * Reset daily request counter
 */
function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
}

/**
 * Check if we can make more API requests today
 */
function canMakeRequest() {
  resetDailyCounter();
  return dailyRequestCount < MAX_DAILY_REQUESTS;
}

/**
 * Fetch movie poster from TMDB API (real movie posters)
 * @param {string} title - Movie title
 * @param {number} year - Movie year (optional)
 * @returns {Promise<{posterUrl: string|null, error: string|null}>}
 */
async function fetchMoviePosterFromTMDB(title, year = null) {
  if (!TMDB_API_KEY) {
    return { posterUrl: null, error: "TMDB API key not configured" };
  }

  try {
    const searchParams = {
      api_key: TMDB_API_KEY,
      query: title,
      language: "en-US",
    };
    
    if (year) {
      searchParams.year = year;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: searchParams,
      timeout: 10000,
    });

    if (response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0];
      if (movie.poster_path) {
        return {
          posterUrl: `${TMDB_IMAGE_BASE}${movie.poster_path}`,
          error: null,
        };
      }
    }

    return { posterUrl: null, error: "Poster not found in TMDB" };
  } catch (error) {
    console.error(`TMDB error for "${title}":`, error.message);
    return { posterUrl: null, error: error.message };
  }
}

/**
 * Fetch movie poster URL from OMDB API (fallback)
 * @param {string} title - Movie title
 * @param {number} year - Movie year (optional, helps with accuracy)
 * @returns {Promise<{posterUrl: string|null, error: string|null}>}
 */
async function fetchMoviePoster(title, year = null) {
  if (!OMDB_API_KEY || OMDB_API_KEY === "demo") {
    return {
      posterUrl: null,
      error: "OMDB API key not configured.",
    };
  }

  if (!canMakeRequest()) {
    return {
      posterUrl: null,
      error: "Daily API request limit reached. Will retry tomorrow.",
    };
  }

  try {
    const params = {
      apikey: OMDB_API_KEY,
      t: title, // Title search
      type: "movie",
      r: "json",
    };

    if (year) {
      params.y = year;
    }

    const response = await axios.get(OMDB_API_URL, {
      params,
      timeout: 10000, // 10 second timeout
    });

    dailyRequestCount++;

    if (response.data.Response === "False") {
      // Movie not found - use reliable placeholder
      const placeholderUrl = `https://dummyimage.com/300x450/2a2a3e/ffffff&text=${encodeURIComponent(title.substring(0, 20))}`;
      return {
        posterUrl: placeholderUrl,
        error: null,
      };
    }

    // Extract poster URL
    const posterUrl = response.data.Poster;
    if (posterUrl && posterUrl !== "N/A" && posterUrl.startsWith("http")) {
      return {
        posterUrl: posterUrl,
        error: null,
      };
    }

    // If poster not available, use reliable placeholder
    const placeholderUrl = `https://dummyimage.com/300x450/2a2a3e/ffffff&text=${encodeURIComponent(title.substring(0, 20))}`;
    return {
      posterUrl: placeholderUrl,
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching poster for "${title}":`, error.message);
    // On error, use reliable placeholder
    const placeholderUrl = `https://dummyimage.com/300x450/2a2a3e/ffffff&text=${encodeURIComponent(title.substring(0, 20))}`;
    return {
      posterUrl: placeholderUrl,
      error: null,
    };
  }
}

/**
 * Update poster URL for a single movie in database
 * @param {number} movieId - Movie ID
 * @param {string} title - Movie title
 * @param {number} year - Movie year
 * @returns {Promise<{success: boolean, posterUrl: string|null, error: string|null}>}
 */
async function updateMoviePoster(movieId, title, year) {
  try {
    // Try TMDB first (real movie posters)
    let result = await fetchMoviePosterFromTMDB(title, year);
    
    // Fallback to OMDB if TMDB fails
    if (!result.posterUrl || result.error) {
      result = await fetchMoviePoster(title, year);
    }

    // Always update with a poster URL (even if it's a placeholder)
    // This ensures every movie has a poster
    if (result.posterUrl) {
      // Update database with new poster URL
      await query(
        "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [result.posterUrl, movieId]
      );

      return {
        success: true,
        posterUrl: result.posterUrl,
        error: null,
      };
    } else {
      // Last resort: use placeholder
      const placeholderUrl = `https://via.placeholder.com/300x450/2a2a3e/ffffff?text=${encodeURIComponent(title.substring(0, 30))}`;
      await query(
        "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [placeholderUrl, movieId]
      );
      
      return {
        success: true,
        posterUrl: placeholderUrl,
        error: null,
      };
    }
  } catch (error) {
    console.error(`Error updating poster for movie ${movieId}:`, error);
    // Even on error, assign a reliable placeholder
    const placeholderUrl = `https://dummyimage.com/300x450/2a2a3e/ffffff&text=${encodeURIComponent(title.substring(0, 20))}`;
    try {
      await query(
        "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [placeholderUrl, movieId]
      );
      return {
        success: true,
        posterUrl: placeholderUrl,
        error: null,
      };
    } catch (dbError) {
      return {
        success: false,
        posterUrl: null,
        error: `Database error: ${dbError.message}`,
      };
    }
  }
}

/**
 * Update poster URLs for all movies missing posters
 * @param {number} batchSize - Number of movies to process per batch
 * @param {number} delayMs - Delay between batches in milliseconds
 * @param {boolean} forceUpdate - If true, update all movies regardless of current poster status
 * @returns {Promise<{updated: number, failed: number, errors: Array}>}
 */
async function updateAllMoviePosters(batchSize = 5, delayMs = 2000, forceUpdate = false) {
  try {
    resetDailyCounter();

    // Get all movies without posters (including empty strings and placeholders)
    let moviesResult;
    if (forceUpdate) {
      // Update all movies
      moviesResult = await query(
        `SELECT id, title, year, poster_url 
         FROM movies 
         ORDER BY id`
      );
    } else {
      // Only update movies without posters
      moviesResult = await query(
        `SELECT id, title, year, poster_url 
         FROM movies 
         WHERE poster_url IS NULL 
            OR poster_url = '' 
            OR poster_url = 'N/A'
            OR LENGTH(TRIM(poster_url)) = 0
         ORDER BY id`
      );
    }

    const movies = moviesResult.rows;
    const errors = [];
    let updated = 0;
    let failed = 0;

    if (movies.length === 0) {
      return {
        updated: 0,
        failed: 0,
        errors: [],
        message: "All movies already have posters!",
      };
    }

    console.log(`🎬 Found ${movies.length} movies without posters. Starting update...`);

    // Process in batches
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} (movies ${i + 1}-${Math.min(i + batchSize, movies.length)})...`);

      for (const movie of batch) {
        if (!canMakeRequest()) {
          console.log(`⚠️  Daily API limit reached. Stopping updates.`);
          break;
        }

        console.log(`  🔍 Fetching poster for: "${movie.title}" (${movie.year})...`);
        
        const result = await updateMoviePoster(movie.id, movie.title, movie.year);
        
        if (result.success) {
          console.log(`  ✅ Updated: ${result.posterUrl}`);
          updated++;
        } else {
          console.log(`  ❌ Failed: ${result.error}`);
          failed++;
          errors.push({
            movieId: movie.id,
            title: movie.title,
            error: result.error,
          });
        }

        // Small delay between individual requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Delay between batches (except for the last batch)
      if (i + batchSize < movies.length) {
        console.log(`  ⏳ Waiting ${delayMs}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      updated,
      failed,
      errors,
      total: movies.length,
      message: `Updated ${updated} posters. ${failed} failed.`,
    };
  } catch (error) {
    console.error("Error updating movie posters:", error);
    return {
      updated: 0,
      failed: 0,
      errors: [{ error: error.message }],
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Get daily request count
 */
function getDailyRequestCount() {
  resetDailyCounter();
  return dailyRequestCount;
}

module.exports = {
  fetchMoviePoster,
  updateMoviePoster,
  updateAllMoviePosters,
  getDailyRequestCount,
};

