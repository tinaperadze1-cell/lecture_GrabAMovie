/**
 * Centralized API client for backend database endpoints
 * All database access goes through this module
 */

// Use environment variable for API base URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Get personalized movie recommendations for a user
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of recommended movie objects
 */
export const getRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getRecommendations:", error);
    throw error;
  }
};

/**
 * Get quiz questions for a movie from database
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Array>} Array of quiz question objects
 */
export const getQuizQuestions = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/quiz`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz questions: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getQuizQuestions:", error);
    throw error;
  }
};

/**
 * Submit quiz results to database
 * @param {number} movieId - Movie's ID
 * @param {number} userId - User's ID (optional)
 * @param {number} score - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 * @param {Object} answers - User's answers object
 * @returns {Promise<Object>} Quiz result object
 */
export const submitQuizResult = async (movieId, userId, score, totalQuestions, answers = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId || null,
        score,
        totalQuestions,
        answers,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to submit quiz result: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - submitQuizResult:", error);
    throw error;
  }
};

/**
 * Get or create today's movie battle
 * @param {number} userId - Optional user ID to check if they've voted
 * @returns {Promise<Object>} Battle object with movies and vote counts
 */
export const getDailyBattle = async (userId = null) => {
  try {
    const url = userId 
      ? `${API_BASE_URL}/battle/daily?userId=${userId}`
      : `${API_BASE_URL}/battle/daily`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch daily battle: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getDailyBattle:", error);
    throw error;
  }
};

/**
 * Submit a vote in a battle
 * @param {number} battleId - Battle ID
 * @param {number} votedForMovieId - Movie ID to vote for
 * @param {number} userId - Optional user ID
 * @returns {Promise<Object>} Updated vote counts
 */
export const submitBattleVote = async (battleId, votedForMovieId, userId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/battle/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battleId, votedForMovieId, userId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to submit vote: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - submitBattleVote:", error);
    throw error;
  }
};

/**
 * Get yesterday's battle winner
 * @returns {Promise<Object|null>} Winner movie object or null
 */
export const getYesterdayWinner = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/battle/yesterday-winner`);
    if (!response.ok) {
      throw new Error(`Failed to fetch yesterday's winner: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getYesterdayWinner:", error);
    return null;
  }
};

/**
 * Get current monthly leader
 * @returns {Promise<Object|null>} Leader movie object or null
 */
export const getMonthlyLeader = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/battle/monthly-leader`);
    if (!response.ok) {
      throw new Error(`Failed to fetch monthly leader: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getMonthlyLeader:", error);
    return null;
  }
};

/**
 * Get battle statistics for a movie
 * @param {number} movieId - Movie ID
 * @returns {Promise<Object>} Battle statistics
 */
export const getMovieBattleStats = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/battle/movie/${movieId}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch battle stats: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getMovieBattleStats:", error);
    return {
      battlesWon: 0,
      battlesLost: 0,
      totalVotesReceived: 0,
      winPercentage: 0,
    };
  }
};

/**
 * Get trending movies with vote counts
 * @param {number} limit - Number of movies to return (default: 5)
 * @param {number} userId - Optional user ID to check voting status
 * @returns {Promise<Array>} Array of trending movie objects
 */
export const getTrendingMovies = async (limit = 5, userId = null) => {
  try {
    const url = userId 
      ? `${API_BASE_URL}/trending-movies?limit=${limit}&userId=${userId}`
      : `${API_BASE_URL}/trending-movies?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trending movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getTrendingMovies:", error);
    throw error;
  }
};

/**
 * Submit a vote for a trending movie
 * @param {number} movieId - Trending movie ID
 * @param {number} userId - Optional user ID
 * @returns {Promise<Object>} Vote result with updated vote count
 */
export const submitTrendingVote = async (movieId, userId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending-movies/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, userId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to submit vote: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - submitTrendingVote:", error);
    throw error;
  }
};

/**
 * Add a new movie to the trending list
 * @param {number} movieId - Movie ID from movies table (optional)
 * @param {string} title - Movie title (required if movieId not provided)
 * @param {string} posterUrl - Movie poster URL (optional)
 * @param {number} userId - User ID who is adding the movie (optional)
 * @returns {Promise<Object>} Newly added movie object
 */
export const addTrendingMovie = async (movieId, title, posterUrl = null, userId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending-movies/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, title, posterUrl, userId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to add movie: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - addTrendingMovie:", error);
    throw error;
  }
};

/**
 * Fetch all movies from the database
 * @returns {Promise<Array>} Array of movie objects
 */
export const fetchMovies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchMovies:", error);
    throw error;
  }
};

/**
 * Fetch a single movie by ID
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Movie object
 */
export const fetchMovie = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch movie: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchMovie:", error);
    throw error;
  }
};

/**
 * Search movies by query string
 * @param {string} query - Search query (title, genre, or description)
 * @returns {Promise<Array>} Array of matching movie objects
 */
export const searchMovies = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Failed to search movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - searchMovies:", error);
    throw error;
  }
};

/**
 * Fetch top-rated movies
 * @param {number} limit - Number of movies to return (default: 10)
 * @returns {Promise<Array>} Array of top-rated movie objects
 */
export const fetchTopRatedMovies = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/top-rated?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch top-rated movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchTopRatedMovies:", error);
    throw error;
  }
};

/**
 * Create new user account in database
 * @param {string} username - User's desired username
 * @param {string} password - User's desired password
 * @returns {Promise<Object>} User object with id and username
 */
export const signup = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Signup failed");
    }

    return data;
  } catch (error) {
    console.error("API Error - signup:", error);
    throw error;
  }
};

/**
 * Authenticate user with database
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<Object>} User object with id and username
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  } catch (error) {
    console.error("API Error - login:", error);
    throw error;
  }
};

/**
 * Check backend health and database connection
 * @returns {Promise<Object>} Health status object
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - checkHealth:", error);
    throw error;
  }
};

/**
 * Add movie to user's favourites
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Success response
 */
export const addToFavourites = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add to favourites");
    }

    return data;
  } catch (error) {
    console.error("API Error - addToFavourites:", error);
    throw error;
  }
};

/**
 * Remove movie from user's favourites
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Success response
 */
export const removeFromFavourites = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId }),
    });

    const data = await response.json();

    // 404 means it's not in favourites, which is fine - treat as success
    if (response.status === 404) {
      return { success: true, message: "Movie not in favourites" };
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove from favourites");
    }

    return data;
  } catch (error) {
    console.error("API Error - removeFromFavourites:", error);
    throw error;
  }
};

/**
 * Add movie to user's watchlist
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Success response
 */
export const addToWatchlist = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add to watchlist");
    }

    return data;
  } catch (error) {
    console.error("API Error - addToWatchlist:", error);
    throw error;
  }
};

/**
 * Remove movie from user's watchlist
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Success response
 */
export const removeFromWatchlist = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId }),
    });

    const data = await response.json();

    // 404 means it's not in watchlist, which is fine - treat as success
    if (response.status === 404) {
      return { success: true, message: "Movie not in watchlist" };
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove from watchlist");
    }

    return data;
  } catch (error) {
    console.error("API Error - removeFromWatchlist:", error);
    throw error;
  }
};

/**
 * Get user's favourite movie IDs
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of movie IDs
 */
export const getFavourites = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch favourites: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getFavourites:", error);
    throw error;
  }
};

/**
 * Get user's watchlist movie IDs
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of movie IDs
 */
export const getWatchlist = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getWatchlist:", error);
    throw error;
  }
};

/**
 * Save or update a rating for a movie
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @param {number} rating - Rating value (1-5)
 * @returns {Promise<Object>} Success response
 */
export const saveRating = async (userId, movieId, rating) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId, rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save rating");
    }

    return data;
  } catch (error) {
    console.error("API Error - saveRating:", error);
    throw error;
  }
};

/**
 * Get all ratings for a movie with average
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Object with average, count, and ratings array
 */
export const getMovieRatings = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/${movieId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ratings: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getMovieRatings:", error);
    throw error;
  }
};

/**
 * Get user's specific rating for a movie
 * @param {number} movieId - Movie's ID
 * @param {number} userId - User's ID
 * @returns {Promise<Object>} Object with rating or null
 */
export const getUserRating = async (movieId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/${movieId}/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user rating: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getUserRating:", error);
    throw error;
  }
};

/**
 * Create a new comment for a movie
 * @param {number} userId - User's ID
 * @param {number} movieId - Movie's ID
 * @param {string} commentText - Comment text
 * @returns {Promise<Object>} Comment object
 */
export const createComment = async (userId, movieId, commentText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, movieId, commentText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create comment");
    }

    return data;
  } catch (error) {
    console.error("API Error - createComment:", error);
    throw error;
  }
};

/**
 * Get all comments for a movie
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Array>} Array of comment objects
 */
export const getMovieComments = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${movieId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getMovieComments:", error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {number} commentId - Comment's ID
 * @param {number} userId - User's ID
 * @param {string} commentText - Updated comment text
 * @returns {Promise<Object>} Updated comment object
 */
export const updateComment = async (commentId, userId, commentText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, commentText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update comment");
    }

    return data;
  } catch (error) {
    console.error("API Error - updateComment:", error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} commentId - Comment's ID
 * @param {number} userId - User's ID
 * @returns {Promise<Object>} Success response
 */
export const deleteComment = async (commentId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete comment");
    }

    return data;
  } catch (error) {
    console.error("API Error - deleteComment:", error);
    throw error;
  }
};

/**
 * Get user profile
 * @param {number} userId - User's ID
 * @returns {Promise<Object>} User profile object
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getUserProfile:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User's ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    return data;
  } catch (error) {
    console.error("API Error - updateUserProfile:", error);
    throw error;
  }
};

/**
 * Get user's past ratings
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of rating objects with movie info
 */
export const getUserRatings = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/ratings`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user ratings: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getUserRatings:", error);
    throw error;
  }
};

/**
 * Get user's past comments
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of comment objects with movie info
 */
export const getUserComments = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/comments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user comments: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getUserComments:", error);
    throw error;
  }
};

/**
 * Get actors/cast for a movie
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Object>} Object with movieId and actors array
 */
export const fetchMovieActors = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/actors`);
    if (!response.ok) {
      throw new Error(`Failed to fetch movie actors: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchMovieActors:", error);
    throw error;
  }
};

/**
 * Fetch now playing movies from TMDB
 * @returns {Promise<Array>} Array of movie objects
 */
export const fetchNowPlayingMovies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/now-playing`);
    if (!response.ok) {
      throw new Error(`Failed to fetch now playing movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchNowPlayingMovies:", error);
    throw error;
  }
};

/**
 * Fetch upcoming movies from TMDB
 * @returns {Promise<Array>} Array of movie objects
 */
export const fetchUpcomingMovies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/upcoming`);
    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming movies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchUpcomingMovies:", error);
    throw error;
  }
};

/**
 * Fetch all available snacks
 * @returns {Promise<Array>} Array of snack objects
 */
export const fetchSnacks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/snacks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch snacks: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - fetchSnacks:", error);
    throw error;
  }
};

/**
 * Create a showing for a movie
 * @param {Object} showingData - Showing data (movieId, showtime, theaterName, totalSeats)
 * @returns {Promise<Object>} Created showing object
 */
export const createShowing = async (showingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/showings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(showingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create showing");
    }

    return data;
  } catch (error) {
    console.error("API Error - createShowing:", error);
    throw error;
  }
};

/**
 * Get showings for a movie
 * @param {number} movieId - Movie's ID
 * @returns {Promise<Array>} Array of showing objects
 */
export const getShowings = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/showings/${movieId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch showings: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getShowings:", error);
    throw error;
  }
};

/**
 * Get seats for a showing
 * @param {number} showingId - Showing's ID
 * @returns {Promise<Array>} Array of seat objects
 */
export const getSeats = async (showingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/showings/${showingId}/seats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch seats: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getSeats:", error);
    throw error;
  }
};

/**
 * Create a booking
 * @param {Object} bookingData - Booking data (userId, movieId, showingId, seatIds, snacks, totalAmount)
 * @returns {Promise<Object>} Created booking object
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create booking");
    }

    return data;
  } catch (error) {
    console.error("API Error - createBooking:", error);
    throw error;
  }
};

/**
 * Get user's bookings
 * @param {number} userId - User's ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getUserBookings = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error - getUserBookings:", error);
    throw error;
  }
};

// ==================== ADMIN API FUNCTIONS ====================

/**
 * Admin: Create a new movie
 */
export const adminCreateMovie = async (movieData, userId, posterFile, trailerFile) => {
  try {
    const formData = new FormData();
    formData.append("title", movieData.title);
    formData.append("year", movieData.year);
    formData.append("genre", movieData.genre);
    formData.append("description", movieData.description || "");
    formData.append("duration", movieData.duration || "");
    formData.append("userId", userId);
    if (posterFile) formData.append("poster", posterFile);
    if (trailerFile) formData.append("trailer", trailerFile);

    const response = await fetch(`${API_BASE_URL}/admin/movies`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create movie");
    return data;
  } catch (error) {
    console.error("API Error - adminCreateMovie:", error);
    throw error;
  }
};

/**
 * Admin: Update a movie
 */
export const adminUpdateMovie = async (movieId, movieData, userId, posterFile, trailerFile) => {
  try {
    const formData = new FormData();
    Object.keys(movieData).forEach(key => {
      if (movieData[key] !== undefined) formData.append(key, movieData[key]);
    });
    formData.append("userId", userId);
    if (posterFile) formData.append("poster", posterFile);
    if (trailerFile) formData.append("trailer", trailerFile);

    const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update movie");
    return data;
  } catch (error) {
    console.error("API Error - adminUpdateMovie:", error);
    throw error;
  }
};

/**
 * Admin: Delete a movie
 */
export const adminDeleteMovie = async (movieId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete movie");
    return data;
  } catch (error) {
    console.error("API Error - adminDeleteMovie:", error);
    throw error;
  }
};

/**
 * Admin: Get all showings
 */
export const adminGetShowings = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/showings?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch showings: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetShowings:", error);
    throw error;
  }
};

/**
 * Admin: Create a showing
 */
export const adminCreateShowing = async (showingData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/showings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...showingData, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create showing");
    return data;
  } catch (error) {
    console.error("API Error - adminCreateShowing:", error);
    throw error;
  }
};

/**
 * Admin: Update a showing
 */
export const adminUpdateShowing = async (showingId, showingData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/showings/${showingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...showingData, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update showing");
    return data;
  } catch (error) {
    console.error("API Error - adminUpdateShowing:", error);
    throw error;
  }
};

/**
 * Admin: Delete a showing
 */
export const adminDeleteShowing = async (showingId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/showings/${showingId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete showing");
    return data;
  } catch (error) {
    console.error("API Error - adminDeleteShowing:", error);
    throw error;
  }
};

/**
 * Admin: Get all bookings
 */
export const adminGetBookings = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bookings?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetBookings:", error);
    throw error;
  }
};

/**
 * Admin: Delete a booking (ticket)
 */
export const adminDeleteBooking = async (bookingId, userId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete booking");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - adminDeleteBooking:", error);
    throw error;
  }
};

/**
 * Admin: Get all users
 */
export const adminGetUsers = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetUsers:", error);
    throw error;
  }
};

/**
 * Admin: Get user activity
 */
export const adminGetUserActivity = async (targetUserId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}/activity?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch user activity: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetUserActivity:", error);
    throw error;
  }
};

/**
 * Admin: Ban/unban a user
 */
export const adminBanUser = async (targetUserId, banData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...banData, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update ban status");
    return data;
  } catch (error) {
    console.error("API Error - adminBanUser:", error);
    throw error;
  }
};

/**
 * Admin: Warn a user
 */
export const adminWarnUser = async (targetUserId, warningReason, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}/warn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warningReason, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to warn user");
    return data;
  } catch (error) {
    console.error("API Error - adminWarnUser:", error);
    throw error;
  }
};

/**
 * Admin: Get flagged comments
 */
export const adminGetFlaggedComments = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/comments/flagged?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch flagged comments: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetFlaggedComments:", error);
    throw error;
  }
};

/**
 * Admin: Get all comments
 */
export const adminGetComments = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/comments?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch comments: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetComments:", error);
    throw error;
  }
};

/**
 * Admin: Delete a comment
 */
export const adminDeleteComment = async (commentId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete comment");
    return data;
  } catch (error) {
    console.error("API Error - adminDeleteComment:", error);
    throw error;
  }
};

/**
 * Admin: Unflag a comment
 */
export const adminUnflagComment = async (commentId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}/unflag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to unflag comment");
    return data;
  } catch (error) {
    console.error("API Error - adminUnflagComment:", error);
    throw error;
  }
};

/**
 * Admin: Get rating stats for a movie
 */
export const adminGetMovieRatings = async (movieId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}/ratings?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch rating stats: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetMovieRatings:", error);
    throw error;
  }
};

/**
 * Admin: Get popular movies (most favorited/watchlisted)
 */
export const adminGetPopularMovies = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/movies/popular?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch popular movies: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetPopularMovies:", error);
    throw error;
  }
};

/**
 * Admin: Remove movie from user's favourites
 */
export const adminRemoveFavourite = async (userId, movieId, adminUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/favourites/${movieId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to remove favourite");
    return data;
  } catch (error) {
    console.error("API Error - adminRemoveFavourite:", error);
    throw error;
  }
};

/**
 * Admin: Remove movie from user's watchlist
 */
export const adminRemoveWatchlist = async (userId, movieId, adminUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/watchlist/${movieId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to remove watchlist item");
    return data;
  } catch (error) {
    console.error("API Error - adminRemoveWatchlist:", error);
    throw error;
  }
};

/**
 * Admin: Get all quizzes
 */
export const adminGetAllQuizzes = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetAllQuizzes:", error);
    throw error;
  }
};

/**
 * Admin: Get a specific quiz by ID
 */
export const adminGetQuizById = async (quizId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizId}?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetQuizById:", error);
    throw error;
  }
};

/**
 * Admin: Create a new quiz
 */
export const adminCreateQuiz = async (quizData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quizData, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create quiz");
    return data;
  } catch (error) {
    console.error("API Error - adminCreateQuiz:", error);
    throw error;
  }
};

/**
 * Admin: Update a quiz
 */
export const adminUpdateQuiz = async (quizId, quizData, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quizData, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update quiz");
    return data;
  } catch (error) {
    console.error("API Error - adminUpdateQuiz:", error);
    throw error;
  }
};

/**
 * Admin: Delete a quiz
 */
export const adminDeleteQuiz = async (quizId, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete quiz");
    return data;
  } catch (error) {
    console.error("API Error - adminDeleteQuiz:", error);
    throw error;
  }
};

/**
 * Admin: Delete a question from a quiz
 */
export const adminDeleteQuizQuestion = async (quizId, questionIndex, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizId}/questions/${questionIndex}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete question");
    return data;
  } catch (error) {
    console.error("API Error - adminDeleteQuizQuestion:", error);
    throw error;
  }
};

/**
 * Admin: Get all quiz results (read-only)
 */
export const adminGetQuizResults = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quiz-results?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch quiz results: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetQuizResults:", error);
    throw error;
  }
};

/**
 * Admin: Get quiz statistics overview
 */
export const adminGetQuizStatistics = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/quiz-statistics?userId=${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch quiz statistics: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("API Error - adminGetQuizStatistics:", error);
    throw error;
  }
};

// Export the base URL for direct access if needed
export { API_BASE_URL };

