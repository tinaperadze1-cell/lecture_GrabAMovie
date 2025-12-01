const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");

/**
 * TMDB Service for fetching movie data
 * Handles "Now Playing" and "Upcoming" movies
 */

// Get TMDB API key from environment, ignore placeholder values
const TMDB_API_KEY = (process.env.TMDB_API_KEY && 
                      process.env.TMDB_API_KEY !== "MY_KEY_HERE" && 
                      process.env.TMDB_API_KEY !== "my_real_key" &&
                      process.env.TMDB_API_KEY.trim() !== "") 
                      ? process.env.TMDB_API_KEY 
                      : null;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * Fetch now playing movies from TMDB
 * @returns {Promise<Array>} Array of movie objects
 */
async function fetchNowPlayingMovies() {
  if (!TMDB_API_KEY) {
    console.warn("⚠️  TMDB_API_KEY not configured. Returning empty array.");
    return [];
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US",
        page: 1,
        region: "US",
      },
      timeout: 10000,
    });

    if (response.data && response.data.results) {
      return response.data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        releaseDate: movie.release_date || null,
        posterPath: movie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
          : null,
        backdropPath: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        genreIds: movie.genre_ids || [],
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching now playing movies from TMDB:", error.message);
    return [];
  }
}

/**
 * Fetch upcoming movies from TMDB
 * @returns {Promise<Array>} Array of movie objects
 */
async function fetchUpcomingMovies() {
  if (!TMDB_API_KEY) {
    console.warn("⚠️  TMDB_API_KEY not configured. Returning empty array.");
    return [];
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US",
        page: 1,
        region: "US",
      },
      timeout: 10000,
    });

    if (response.data && response.data.results) {
      return response.data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        releaseDate: movie.release_date || null,
        posterPath: movie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
          : null,
        backdropPath: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        genreIds: movie.genre_ids || [],
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching upcoming movies from TMDB:", error.message);
    return [];
  }
}

/**
 * Get movie details by TMDB ID
 * @param {number} tmdbId - TMDB movie ID
 * @returns {Promise<Object|null>} Movie details or null
 */
async function getMovieDetails(tmdbId) {
  if (!TMDB_API_KEY) {
    console.warn("⚠️  TMDB_API_KEY not configured.");
    return null;
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US",
      },
      timeout: 10000,
    });

    if (response.data) {
      const movie = response.data;
      return {
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        releaseDate: movie.release_date || null,
        posterPath: movie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
          : null,
        backdropPath: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null,
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        runtime: movie.runtime || null,
        genres: movie.genres || [],
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching movie details for TMDB ID ${tmdbId}:`, error.message);
    return null;
  }
}

module.exports = {
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  getMovieDetails,
};

