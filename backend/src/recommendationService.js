const { query } = require("./db");

/**
 * Get personalized movie recommendations for a user
 * Based on:
 * 1. User's ratings (find similar genres/ratings)
 * 2. Watchlist and favorites (find similar movies)
 * 3. Collaborative filtering (what similar users liked)
 */
async function getRecommendations(userId) {
  try {
    // Get user's activity
    const userRatings = await query(
      `SELECT r.movie_id, r.rating, m.genre, m.year
       FROM ratings r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = $1`,
      [userId]
    );

    const userWatchlist = await query(
      `SELECT w.movie_id, m.genre, m.year
       FROM watchlist w
       JOIN movies m ON w.movie_id = m.id
       WHERE w.user_id = $1`,
      [userId]
    );

    const userFavorites = await query(
      `SELECT f.movie_id, m.genre, m.year
       FROM favourites f
       JOIN movies m ON f.movie_id = m.id
       WHERE f.user_id = $1`,
      [userId]
    );

    // If user has no activity, return popular movies
    if (userRatings.rows.length === 0 && userWatchlist.rows.length === 0 && userFavorites.rows.length === 0) {
      return await getPopularMovies(5);
    }

    // Collect all genres the user likes
    const likedGenres = new Set();
    const likedMovies = new Set();

    userRatings.rows.forEach((row) => {
      if (row.rating >= 3) {
        // User liked this movie (3+ stars)
        likedGenres.add(row.genre);
        likedMovies.add(row.movie_id);
      }
    });

    userWatchlist.rows.forEach((row) => {
      likedGenres.add(row.genre);
      likedMovies.add(row.movie_id);
    });

    userFavorites.rows.forEach((row) => {
      likedGenres.add(row.genre);
      likedMovies.add(row.movie_id);
    });

    // Strategy 1: Content-based filtering - Find movies with similar genres
    const genreRecommendations = await getMoviesByGenres(
      Array.from(likedGenres),
      Array.from(likedMovies),
      3
    );

    // Strategy 2: Collaborative filtering - Find what similar users liked
    const collaborativeRecommendations = await getCollaborativeRecommendations(
      userId,
      Array.from(likedMovies),
      2
    );

    // Combine and deduplicate recommendations
    const allRecommendations = [...genreRecommendations, ...collaborativeRecommendations];
    const uniqueRecommendations = [];
    const seenIds = new Set();

    for (const movie of allRecommendations) {
      if (!seenIds.has(movie.id) && !likedMovies.has(movie.id)) {
        uniqueRecommendations.push(movie);
        seenIds.add(movie.id);
      }
    }

    // If we don't have enough recommendations, fill with popular movies
    if (uniqueRecommendations.length < 5) {
      const popularMovies = await getPopularMovies(5 - uniqueRecommendations.length);
      for (const movie of popularMovies) {
        if (!seenIds.has(movie.id) && !likedMovies.has(movie.id)) {
          uniqueRecommendations.push(movie);
          seenIds.add(movie.id);
        }
      }
    }

    // Return top 5 recommendations
    return uniqueRecommendations.slice(0, 5);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Fallback to popular movies
    return await getPopularMovies(5);
  }
}

/**
 * Get movies by genres that user likes (excluding already liked movies)
 */
async function getMoviesByGenres(genres, excludeMovieIds, limit) {
  if (genres.length === 0) return [];

  try {
    // Build query with proper parameterization
    let queryText = `SELECT DISTINCT m.*, 
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(r.id) as rating_count
       FROM movies m
       LEFT JOIN ratings r ON m.id = r.movie_id
       WHERE m.genre = ANY($1)`;
    
    const params = [genres];
    
    if (excludeMovieIds.length > 0) {
      queryText += ` AND m.id NOT IN (${excludeMovieIds.map((_, i) => `$${params.length + 1 + i}`).join(", ")})`;
      params.push(...excludeMovieIds);
    }
    
    queryText += ` GROUP BY m.id
       HAVING COUNT(r.id) > 0 OR m.imdb_rating IS NOT NULL
       ORDER BY COALESCE(AVG(r.rating), m.imdb_rating, 0) DESC, m.year DESC
       LIMIT $${params.length + 1}`;
    
    params.push(limit);

    const result = await query(queryText, params);

    return result.rows;
  } catch (error) {
    console.error("Error getting movies by genres:", error);
    return [];
  }
}

/**
 * Collaborative filtering - Find users with similar tastes and recommend what they liked
 */
async function getCollaborativeRecommendations(userId, excludeMovieIds, limit) {
  try {
    // Find users who rated the same movies similarly
    const similarUsers = await query(
      `SELECT DISTINCT r2.user_id, 
              COUNT(*) as common_movies,
              AVG(ABS(r1.rating - r2.rating)) as rating_diff
       FROM ratings r1
       JOIN ratings r2 ON r1.movie_id = r2.movie_id AND r1.user_id != r2.user_id
       WHERE r1.user_id = $1
       GROUP BY r2.user_id
       HAVING COUNT(*) >= 2 AND AVG(ABS(r1.rating - r2.rating)) <= 1.5
       ORDER BY common_movies DESC, rating_diff ASC
       LIMIT 10`,
      [userId]
    );

    if (similarUsers.rows.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.rows.map((row) => row.user_id);

    // Get movies that similar users rated highly (4+ stars) that current user hasn't seen
    let queryText = `SELECT DISTINCT m.*, 
              AVG(r.rating) as avg_rating,
              COUNT(r.id) as rating_count
       FROM ratings r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = ANY($1::int[])
       AND r.rating >= 4`;
    
    const params = [similarUserIds];
    
    if (excludeMovieIds.length > 0) {
      queryText += ` AND r.movie_id NOT IN (${excludeMovieIds.map((_, i) => `$${params.length + 1 + i}`).join(", ")})`;
      params.push(...excludeMovieIds);
    }
    
    queryText += ` GROUP BY m.id
       HAVING COUNT(r.id) >= 2
       ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC
       LIMIT $${params.length + 1}`;
    
    params.push(limit);

    const result = await query(queryText, params);

    return result.rows;
  } catch (error) {
    console.error("Error in collaborative filtering:", error);
    return [];
  }
}

/**
 * Get popular movies as fallback
 */
async function getPopularMovies(limit) {
  try {
    const result = await query(
      `SELECT m.*, 
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(r.id) as rating_count
       FROM movies m
       LEFT JOIN ratings r ON m.id = r.movie_id
       GROUP BY m.id
       ORDER BY COALESCE(AVG(r.rating), m.imdb_rating, 0) DESC, rating_count DESC, m.year DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error("Error getting popular movies:", error);
    return [];
  }
}

/**
 * Get cached recommendations or generate new ones
 * Cache key includes user ID and current date for daily updates
 */
async function getCachedRecommendations(userId) {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const cacheKey = `recommendations_${userId}_${today}`;

    // Check if we have cached recommendations for today
    // For simplicity, we'll just generate fresh recommendations
    // In production, you might want to use Redis or a cache table
    return await getRecommendations(userId);
  } catch (error) {
    console.error("Error getting cached recommendations:", error);
    return await getPopularMovies(5);
  }
}

module.exports = {
  getRecommendations,
  getCachedRecommendations,
  getPopularMovies,
};

