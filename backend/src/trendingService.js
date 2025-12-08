const { query } = require("./db");

/**
 * Get current month string in YYYY-MM format
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get trending movies with vote counts for current month
 * Returns top movies sorted by votes
 */
async function getTrendingMovies(limit = 5) {
  try {
    const currentMonth = getCurrentMonth();

    // Get movies with their vote counts for current month
    const result = await query(
      `SELECT 
        tm.id,
        tm.movie_id,
        tm.title,
        tm.poster_url,
        tm.created_at,
        tm.added_by,
        COALESCE(COUNT(tv.id), 0) as votes
       FROM trending_movies tm
       LEFT JOIN trending_votes tv ON tm.id = tv.movie_id AND tv.month = $1
       GROUP BY tm.id, tm.movie_id, tm.title, tm.poster_url, tm.created_at, tm.added_by
       ORDER BY votes DESC, tm.created_at DESC
       LIMIT $2`,
      [currentMonth, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      movieId: row.movie_id,
      title: row.title,
      posterUrl: row.poster_url,
      votes: parseInt(row.votes) || 0,
      createdAt: row.created_at,
      addedBy: row.added_by,
    }));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    throw error;
  }
}

/**
 * Get all trending movies (no limit, for admin/management)
 */
async function getAllTrendingMovies() {
  try {
    const currentMonth = getCurrentMonth();

    const result = await query(
      `SELECT 
        tm.id,
        tm.movie_id,
        tm.title,
        tm.poster_url,
        tm.created_at,
        tm.added_by,
        COALESCE(COUNT(tv.id), 0) as votes
       FROM trending_movies tm
       LEFT JOIN trending_votes tv ON tm.id = tv.movie_id AND tv.month = $1
       GROUP BY tm.id, tm.movie_id, tm.title, tm.poster_url, tm.created_at, tm.added_by
       ORDER BY votes DESC, tm.created_at DESC`,
      [currentMonth]
    );

    return result.rows.map(row => ({
      id: row.id,
      movieId: row.movie_id,
      title: row.title,
      posterUrl: row.poster_url,
      votes: parseInt(row.votes) || 0,
      createdAt: row.created_at,
      addedBy: row.added_by,
    }));
  } catch (error) {
    console.error("Error fetching all trending movies:", error);
    throw error;
  }
}

/**
 * Check if user has already voted for a movie this month
 */
async function hasUserVoted(movieId, userId, month = null) {
  if (!userId) return false;
  
  try {
    const currentMonth = month || getCurrentMonth();
    const result = await query(
      `SELECT id FROM trending_votes 
       WHERE movie_id = $1 AND user_id = $2 AND month = $3`,
      [movieId, userId, currentMonth]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking user vote:", error);
    return false;
  }
}

/**
 * Submit a vote for a trending movie
 */
async function submitVote(movieId, userId) {
  try {
    const currentMonth = getCurrentMonth();

    // Check if movie exists in trending_movies
    const movieCheck = await query(
      `SELECT id FROM trending_movies WHERE id = $1`,
      [movieId]
    );

    if (movieCheck.rows.length === 0) {
      throw new Error("Movie not found in trending list");
    }

    // Check if user already voted this month (if logged in)
    if (userId) {
      const alreadyVoted = await hasUserVoted(movieId, userId, currentMonth);
      if (alreadyVoted) {
        throw new Error("You have already voted for this movie this month");
      }
    }

    // Insert vote
    await query(
      `INSERT INTO trending_votes (movie_id, user_id, month, vote_date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [movieId, userId || null, currentMonth]
    );

    // Get updated vote count
    const voteCount = await query(
      `SELECT COUNT(*) as count 
       FROM trending_votes 
       WHERE movie_id = $1 AND month = $2`,
      [movieId, currentMonth]
    );

    return {
      success: true,
      votes: parseInt(voteCount.rows[0].count) || 0,
    };
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
}

/**
 * Add a new movie to the trending list
 */
async function addTrendingMovie(movieId, title, posterUrl, addedBy) {
  try {
    // Check if movie already exists in trending list (case-insensitive title check)
    let existing;
    if (movieId) {
      // First check by movie_id (exact match)
      existing = await query(
        `SELECT id, title FROM trending_movies WHERE movie_id = $1`,
        [movieId]
      );
    }
    
    // Also check by title (case-insensitive)
    if (!existing || existing.rows.length === 0) {
      existing = await query(
        `SELECT id, title FROM trending_movies WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))`,
        [title]
      );
    }

    if (existing.rows.length > 0) {
      throw new Error(`"${existing.rows[0].title}" is already in the trending list`);
    }

    // If movieId is provided, fetch movie details from movies table
    if (movieId) {
      const movieResult = await query(
        `SELECT title, poster_url FROM movies WHERE id = $1`,
        [movieId]
      );

      if (movieResult.rows.length > 0) {
        const movie = movieResult.rows[0];
        title = title || movie.title;
        posterUrl = posterUrl || movie.poster_url;
      }
    }

    if (!title) {
      throw new Error("Movie title is required");
    }

    // Insert into trending_movies
    const result = await query(
      `INSERT INTO trending_movies (movie_id, title, poster_url, added_by, votes)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING id, movie_id, title, poster_url, votes, created_at`,
      [movieId || null, title, posterUrl || null, addedBy || null]
    );

    return {
      id: result.rows[0].id,
      movieId: result.rows[0].movie_id,
      title: result.rows[0].title,
      posterUrl: result.rows[0].poster_url,
      votes: 0,
      createdAt: result.rows[0].created_at,
    };
  } catch (error) {
    console.error("Error adding trending movie:", error);
    throw error;
  }
}

/**
 * Get user's voting status for all trending movies (which ones they've voted for)
 */
async function getUserVotingStatus(userId, month = null) {
  if (!userId) return {};

  try {
    const currentMonth = month || getCurrentMonth();
    const result = await query(
      `SELECT movie_id FROM trending_votes 
       WHERE user_id = $1 AND month = $2`,
      [userId, currentMonth]
    );

    const votedMovies = {};
    result.rows.forEach(row => {
      votedMovies[row.movie_id] = true;
    });

    return votedMovies;
  } catch (error) {
    console.error("Error fetching user voting status:", error);
    return {};
  }
}

module.exports = {
  getTrendingMovies,
  getAllTrendingMovies,
  hasUserVoted,
  submitVote,
  addTrendingMovie,
  getUserVotingStatus,
  getCurrentMonth,
};

