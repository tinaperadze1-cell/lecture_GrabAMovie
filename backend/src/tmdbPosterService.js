const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");
const { query } = require("./db");

/**
 * TMDB Poster Service
 * Fetches movie posters from TMDB API (better quality and free)
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY || null;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * Search for a movie in TMDB and get its poster
 * @param {string} title - Movie title
 * @param {number} year - Movie year (optional)
 * @returns {Promise<{posterUrl: string|null, error: string|null}>}
 */
async function fetchMoviePosterFromTMDB(title, year = null) {
  try {
    // Search for the movie
    const searchParams = {
      api_key: TMDB_API_KEY || "demo",
      query: title,
      language: "en-US",
    };
    
    if (year) {
      searchParams.year = year;
    }

    const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: searchParams,
      timeout: 10000,
    });

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      // Get the first result (most relevant)
      const movie = searchResponse.data.results[0];
      
      if (movie.poster_path) {
        const posterUrl = `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
        return {
          posterUrl: posterUrl,
          error: null,
        };
      }
    }

    // If no poster found, use a better placeholder service
    return {
      posterUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&size=500&background=1a1a2e&color=ffffff&bold=true`,
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching TMDB poster for "${title}":`, error.message);
    
    // Use a better placeholder that always works
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(title + (year ? ' ' + year : ''))}&size=500&background=2a2a3e&color=ffffff&bold=true`;
    return {
      posterUrl: placeholderUrl,
      error: null,
    };
  }
}

/**
 * Get poster URL with fallback strategy
 * Tries multiple sources to ensure we always get a poster
 */
async function getMoviePosterUrl(title, year = null) {
  // Strategy 1: Try TMDB (if API key available)
  if (TMDB_API_KEY) {
    const tmdbResult = await fetchMoviePosterFromTMDB(title, year);
    if (tmdbResult.posterUrl && !tmdbResult.error) {
      return tmdbResult;
    }
  }
  
  // Strategy 2: Use a reliable placeholder service that always works
  // Using ui-avatars which creates images from text
  const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&size=500&background=1a1a2e&color=ffffff&bold=true&length=2`;
  return {
    posterUrl: placeholderUrl,
    error: null,
  };
}

/**
 * Update poster URL for a single movie
 */
async function updateMoviePoster(movieId, title, year) {
  try {
    const result = await getMoviePosterUrl(title, year);
    
    if (result.posterUrl) {
      await query(
        "UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [result.posterUrl, movieId]
      );
      
      return {
        success: true,
        posterUrl: result.posterUrl,
        error: null,
      };
    }
    
    return {
      success: false,
      posterUrl: null,
      error: "Failed to get poster URL",
    };
  } catch (error) {
    console.error(`Error updating poster for movie ${movieId}:`, error);
    return {
      success: false,
      posterUrl: null,
      error: error.message,
    };
  }
}

/**
 * Update all movie posters
 */
async function updateAllMoviePosters(batchSize = 10, delayMs = 1000) {
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

    console.log(`🎬 Updating posters for ${movies.length} movies...`);

    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}...`);

      for (const movie of batch) {
        console.log(`  🔍 Updating: "${movie.title}" (${movie.year})...`);
        
        const result = await updateMoviePoster(movie.id, movie.title, movie.year);
        
        if (result.success) {
          console.log(`  ✅ Updated`);
          updated++;
        } else {
          console.log(`  ❌ Failed: ${result.error}`);
          failed++;
          errors.push({ movieId: movie.id, title: movie.title, error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (i + batchSize < movies.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

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
  getMoviePosterUrl,
  updateMoviePoster,
  updateAllMoviePosters,
};

