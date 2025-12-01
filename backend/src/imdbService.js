const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");
const { query } = require("./db");

/**
 * IMDB Rating Service using OMDB API
 * Free tier: 1,000 requests per day
 */

const OMDB_API_KEY = process.env.OMDB_API_KEY || "ca478e54"; // Default API key, can be overridden by .env file
const OMDB_API_URL = "http://www.omdbapi.com/";

// Check if API key is configured
if (!OMDB_API_KEY || OMDB_API_KEY === "demo") {
  console.warn("⚠️  OMDB_API_KEY not set. IMDB rating updates will be disabled.");
  console.warn("   Get a free API key from: http://www.omdbapi.com/apikey.aspx");
  console.warn("   Add it to your .env file: OMDB_API_KEY=your_key_here");
} else {
  console.log("✅ OMDB API key configured. IMDB rating service is active.");
}

// Rate limiting: track requests per day
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
 * Fetch IMDB rating from OMDB API
 * @param {string} title - Movie title
 * @param {number} year - Movie year (optional, helps with accuracy)
 * @returns {Promise<{rating: number|null, error: string|null}>}
 */
async function fetchImdbRating(title, year = null) {
  // Check if API key is configured
  if (!OMDB_API_KEY || OMDB_API_KEY === "demo") {
    return {
      rating: null,
      error: "OMDB API key not configured. Please set OMDB_API_KEY in .env file.",
    };
  }

  if (!canMakeRequest()) {
    return {
      rating: null,
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
      // Movie not found or API error
      return {
        rating: null,
        error: response.data.Error || "Movie not found in IMDB database",
      };
    }

    // Extract IMDB rating
    const imdbRating = response.data.imdbRating;
    if (imdbRating && imdbRating !== "N/A") {
      const rating = parseFloat(imdbRating);
      if (!isNaN(rating) && rating > 0) {
        return {
          rating: rating,
          error: null,
        };
      }
    }

    return {
      rating: null,
      error: "IMDB rating not available for this movie",
    };
  } catch (error) {
    console.error(`Error fetching IMDB rating for "${title}":`, error.message);

    // Handle rate limiting
    if (error.response?.status === 401) {
      return {
        rating: null,
        error: "Invalid API key. Please set OMDB_API_KEY in .env file",
      };
    }

    if (error.response?.status === 429) {
      return {
        rating: null,
        error: "API rate limit exceeded. Will retry later.",
      };
    }

    // Network or timeout errors
    return {
      rating: null,
      error: `API request failed: ${error.message}`,
    };
  }
}

/**
 * Update IMDB rating for a single movie in database
 * @param {number} movieId - Movie ID
 * @param {string} title - Movie title
 * @param {number} year - Movie year
 * @returns {Promise<{success: boolean, rating: number|null, error: string|null}>}
 */
async function updateMovieRating(movieId, title, year) {
  try {
    const result = await fetchImdbRating(title, year);

    if (result.rating !== null) {
      // Update database with new rating and timestamp
      await query(
        "UPDATE movies SET imdb_rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [result.rating, movieId]
      );

      return {
        success: true,
        rating: result.rating,
        error: null,
      };
    } else {
      // Rating unavailable - keep existing rating or set to null
      return {
        success: false,
        rating: null,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`Error updating rating for movie ${movieId}:`, error);
    return {
      success: false,
      rating: null,
      error: `Database error: ${error.message}`,
    };
  }
}

/**
 * Update IMDB ratings for all movies in database
 * Processes in batches to avoid overwhelming the API
 * @param {number} batchSize - Number of movies to process per batch
 * @param {number} delayMs - Delay between batches in milliseconds
 * @param {boolean} forceUpdate - If true, update all movies regardless of last update time
 * @returns {Promise<{updated: number, failed: number, errors: Array}>}
 */
async function updateAllMovieRatings(batchSize = 10, delayMs = 2000, forceUpdate = false) {
  try {
    // Get all movies that need rating updates
    let movies;
    if (forceUpdate) {
      // Force update all movies
      movies = await query(`
        SELECT id, title, year, imdb_rating
        FROM movies
        ORDER BY id
      `);
    } else {
      // Update movies that haven't been updated in the last 24 hours
      movies = await query(`
        SELECT id, title, year, imdb_rating
        FROM movies
        WHERE imdb_rating IS NULL 
           OR updated_at IS NULL 
           OR updated_at < NOW() - INTERVAL '24 hours'
        ORDER BY id
      `);
    }

    if (movies.rows.length === 0) {
      return {
        updated: 0,
        failed: 0,
        errors: [],
        message: "All movies are up to date",
      };
    }

    let updated = 0;
    let failed = 0;
    const errors = [];

    console.log(`🔄 Updating IMDB ratings for ${movies.rows.length} movies...`);
    console.log(`📊 Daily request count: ${dailyRequestCount}/${MAX_DAILY_REQUESTS}`);

    // Process in batches
    for (let i = 0; i < movies.rows.length; i += batchSize) {
      const batch = movies.rows.slice(i, i + batchSize);

      // Check if we can make more requests
      if (!canMakeRequest()) {
        console.log(`⚠️  Daily limit reached. Stopped at ${i} movies.`);
        errors.push({
          message: "Daily API limit reached",
          count: movies.rows.length - i,
        });
        break;
      }

      // Process batch
      const batchPromises = batch.map(async (movie) => {
        const result = await updateMovieRating(movie.id, movie.title, movie.year);

        if (result.success) {
          updated++;
          console.log(`✅ Updated: ${movie.title} (${result.rating}/10)`);
        } else {
          failed++;
          if (result.error) {
            errors.push({
              movie: movie.title,
              error: result.error,
            });
          }
        }

        // Small delay between individual requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      await Promise.all(batchPromises);

      // Delay between batches
      if (i + batchSize < movies.rows.length) {
        console.log(`⏳ Processed ${Math.min(i + batchSize, movies.rows.length)}/${movies.rows.length} movies. Waiting before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      updated,
      failed,
      errors,
      total: movies.rows.length,
      message: `Updated ${updated} movies, ${failed} failed`,
    };
  } catch (error) {
    console.error("Error updating all movie ratings:", error);
    return {
      updated: 0,
      failed: 0,
      errors: [{ message: error.message }],
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Get current daily request count
 */
function getDailyRequestCount() {
  resetDailyCounter();
  return {
    count: dailyRequestCount,
    limit: MAX_DAILY_REQUESTS,
    remaining: MAX_DAILY_REQUESTS - dailyRequestCount,
  };
}

module.exports = {
  fetchImdbRating,
  updateMovieRating,
  updateAllMovieRatings,
  getDailyRequestCount,
  canMakeRequest,
};

