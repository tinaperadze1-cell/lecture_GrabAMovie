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

// Export the base URL for direct access if needed
export { API_BASE_URL };

