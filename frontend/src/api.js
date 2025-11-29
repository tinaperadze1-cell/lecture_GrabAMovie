/**
 * Centralized API client for backend database endpoints
 * All database access goes through this module
 */

const API_BASE_URL = "http://localhost:4000/api";

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

// Export the base URL for direct access if needed
export { API_BASE_URL };

