require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { query } = require("./db");
const { updateMovieRating, updateAllMovieRatings, getDailyRequestCount } = require("./imdbService");
const { updateMoviePoster, updateAllMoviePosters } = require("./posterService");
const { fetchMovieActors } = require("./actorService");
const { startScheduler } = require("./scheduler");
const { fetchNowPlayingMovies, fetchUpcomingMovies, getMovieDetails } = require("./tmdbService");

// Log TMDB API key status on server start (for debugging)
const tmdbKey = process.env.TMDB_API_KEY;
if (!tmdbKey || tmdbKey === "MY_KEY_HERE" || tmdbKey === "my_real_key" || tmdbKey.trim() === "") {
  console.warn("⚠️  WARNING: TMDB_API_KEY is not set in .env file!");
  console.warn("   The 'Soon to be Released' feature will not work.");
  console.warn("   To fix: Add TMDB_API_KEY=your_key to backend/.env");
  console.warn("   Get your free key from: https://www.themoviedb.org/settings/api");
  console.warn("   Or run: node add-tmdb-key.js YOUR_ACTUAL_KEY");
} else {
  console.log(`✅ TMDB_API_KEY is configured (${tmdbKey.substring(0, 8)}...${tmdbKey.substring(tmdbKey.length - 4)})`);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS to allow frontend access
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite default port
      "http://localhost:3000", // Alternative React port
      "http://localhost:5174", // Vite alternative port
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await query("SELECT 1");
    res.json({
      app: "lecture-project-tina",
      status: "ok",
      database: "connected",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      app: "lecture-project-tina",
      status: "error",
      database: "disconnected",
      error: error.message,
    });
  }
});

// GET /api/movies - Fetch all movies from database
app.get("/api/movies", async (req, res) => {
  try {
    // Try to select all columns, but handle case where new columns might not exist
    const result = await query(
      `SELECT 
        id, 
        title, 
        year, 
        genre,
        COALESCE(description, '') as description,
        COALESCE(duration, NULL) as duration,
        COALESCE(poster_url, '') as poster_url,
        COALESCE(trailer_url, '') as trailer_url,
        COALESCE(imdb_rating, NULL) as imdb_rating
      FROM movies 
      ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching movies:", error);
    // If the query fails due to missing columns, try with basic columns only
    if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
      try {
        const basicResult = await query(
          "SELECT id, title, year, genre FROM movies ORDER BY id"
        );
        // Add default values for missing columns
        const moviesWithDefaults = basicResult.rows.map(movie => ({
          ...movie,
          description: null,
          duration: null,
          poster_url: null,
          trailer_url: null
        }));
        res.json(moviesWithDefaults);
      } catch (fallbackError) {
        console.error("Error fetching movies (fallback):", fallbackError);
        res.status(500).json({ error: "Failed to fetch movies" });
      }
    } else {
      res.status(500).json({ error: "Failed to fetch movies" });
    }
  }
});

// GET /api/movies/search?q=query - Search movies by title, genre, or description
app.get("/api/movies/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const result = await query(
      `SELECT 
        id, 
        title, 
        year, 
        genre,
        COALESCE(description, '') as description,
        COALESCE(duration, NULL) as duration,
        COALESCE(poster_url, '') as poster_url,
        COALESCE(trailer_url, '') as trailer_url
      FROM movies 
      WHERE LOWER(title) LIKE $1 
         OR LOWER(genre) LIKE $1
         OR LOWER(COALESCE(description, '')) LIKE $1
      ORDER BY 
        CASE 
          WHEN LOWER(title) LIKE $2 THEN 1
          WHEN LOWER(genre) LIKE $2 THEN 2
          ELSE 3
        END,
        title
      LIMIT 10`,
      [searchTerm, `%${q.trim().toLowerCase()}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

// GET /api/movies/top-rated - Get top-rated movies (by IMDB rating or user ratings)
app.get("/api/movies/top-rated", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    // Get movies with their IMDB ratings and average user ratings
    const result = await query(
      `SELECT 
        m.id, 
        m.title, 
        m.year, 
        m.genre,
        COALESCE(m.description, '') as description,
        COALESCE(m.duration, NULL) as duration,
        COALESCE(m.poster_url, '') as poster_url,
        COALESCE(m.trailer_url, '') as trailer_url,
        COALESCE(m.imdb_rating, NULL) as imdb_rating,
        COALESCE(AVG(r.rating), NULL) as avg_user_rating,
        COUNT(r.id) as rating_count
      FROM movies m
      LEFT JOIN ratings r ON m.id = r.movie_id
      WHERE m.imdb_rating IS NOT NULL OR EXISTS (SELECT 1 FROM ratings WHERE movie_id = m.id)
      GROUP BY m.id, m.title, m.year, m.genre, m.description, m.duration, m.poster_url, m.trailer_url, m.imdb_rating
      ORDER BY 
        COALESCE(m.imdb_rating, 0) DESC,
        COALESCE(AVG(r.rating), 0) DESC
      LIMIT $1`,
      [limitNum]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching top-rated movies:", error);
    res.status(500).json({ error: "Failed to fetch top-rated movies" });
  }
});

// GET /api/movies/:id - Get a single movie by ID
app.get("/api/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT 
        id, 
        title, 
        year, 
        genre,
        COALESCE(description, '') as description,
        COALESCE(duration, NULL) as duration,
        COALESCE(poster_url, '') as poster_url,
        COALESCE(trailer_url, '') as trailer_url,
        COALESCE(imdb_rating, NULL) as imdb_rating
      FROM movies 
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching movie:", error);
    // If the query fails due to missing columns, try with basic columns only
    if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
      try {
        const { id } = req.params;
        const basicResult = await query(
          "SELECT id, title, year, genre FROM movies WHERE id = $1",
          [id]
        );
        
        if (basicResult.rows.length === 0) {
          return res.status(404).json({ error: "Movie not found" });
        }
        
        // Add default values for missing columns
        const movie = {
          ...basicResult.rows[0],
          description: null,
          duration: null,
          poster_url: null,
          trailer_url: null
        };
        res.json(movie);
      } catch (fallbackError) {
        console.error("Error fetching movie (fallback):", fallbackError);
        res.status(500).json({ error: "Failed to fetch movie" });
      }
    } else {
      res.status(500).json({ error: "Failed to fetch movie" });
    }
  }
});

// POST /api/signup - Create new user account in database
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are both required." });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedPassword = password.trim();

    // Validate username length
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters." });
    }

    // Validate password length
    if (normalizedPassword.length < 3) {
      return res.status(400).json({ error: "Password must be at least 3 characters." });
    }

    // Check if username already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE username = $1",
      [normalizedUsername]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Username already exists. Please choose another." });
    }

    // Insert new user into database
    const result = await query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [normalizedUsername, normalizedPassword]
    );

    const newUser = result.rows[0];

    // Success - return user info
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

// POST /api/login - Authenticate user from database
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are both required." });
    }

    // Find user in database
    const result = await query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];

    // Compare password (plain text for now - matches frontend validation)
    if (user.password !== password.trim()) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Success - return user info (no JWT for now, keeping it simple)
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/favourites - Add movie to user's favourites
app.post("/api/favourites", async (req, res) => {
  try {
    const { userId, movieId } = req.body || {};

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "User ID and Movie ID are both required." });
    }

    // Check if already in favourites
    const existing = await query(
      "SELECT id FROM favourites WHERE user_id = $1 AND movie_id = $2",
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Movie already in favourites" });
    }

    // Insert into favourites
    await query(
      "INSERT INTO favourites (user_id, movie_id) VALUES ($1, $2) RETURNING id",
      [userId, movieId]
    );

    res.status(201).json({
      success: true,
      message: "Added to Favourites",
    });
  } catch (error) {
    console.error("Error adding to favourites:", error);
    res.status(500).json({ error: "Failed to add to favourites" });
  }
});

// DELETE /api/favourites - Remove movie from user's favourites
app.delete("/api/favourites", async (req, res) => {
  try {
    const { userId, movieId } = req.body || {};

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "User ID and Movie ID are both required." });
    }

    // Delete from favourites
    const result = await query(
      "DELETE FROM favourites WHERE user_id = $1 AND movie_id = $2 RETURNING id",
      [userId, movieId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found in favourites" });
    }

    res.json({
      success: true,
      message: "Removed from Favourites",
    });
  } catch (error) {
    console.error("Error removing from favourites:", error);
    res.status(500).json({ error: "Failed to remove from favourites" });
  }
});

// POST /api/watchlist - Add movie to user's watchlist
app.post("/api/watchlist", async (req, res) => {
  try {
    const { userId, movieId } = req.body || {};

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "User ID and Movie ID are both required." });
    }

    // Check if already in watchlist
    const existing = await query(
      "SELECT id FROM watchlist WHERE user_id = $1 AND movie_id = $2",
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Movie already in watchlist" });
    }

    // Insert into watchlist
    await query(
      "INSERT INTO watchlist (user_id, movie_id) VALUES ($1, $2) RETURNING id",
      [userId, movieId]
    );

    res.status(201).json({
      success: true,
      message: "Added to Watchlist",
    });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

// DELETE /api/watchlist - Remove movie from user's watchlist
app.delete("/api/watchlist", async (req, res) => {
  try {
    const { userId, movieId } = req.body || {};

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "User ID and Movie ID are both required." });
    }

    // Delete from watchlist
    const result = await query(
      "DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING id",
      [userId, movieId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found in watchlist" });
    }

    res.json({
      success: true,
      message: "Removed from Watchlist",
    });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

// GET /api/favourites/:userId - Get user's favourites
app.get("/api/favourites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      "SELECT movie_id FROM favourites WHERE user_id = $1",
      [userId]
    );
    const movieIds = result.rows.map((row) => row.movie_id);
    res.json(movieIds);
  } catch (error) {
    console.error("Error fetching favourites:", error);
    res.status(500).json({ error: "Failed to fetch favourites" });
  }
});

// GET /api/watchlist/:userId - Get user's watchlist
app.get("/api/watchlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      "SELECT movie_id FROM watchlist WHERE user_id = $1",
      [userId]
    );
    const movieIds = result.rows.map((row) => row.movie_id);
    res.json(movieIds);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

// POST /api/ratings - Create or update a rating (1-5 stars)
app.post("/api/ratings", async (req, res) => {
  try {
    const { userId, movieId, rating } = req.body || {};

    if (!userId || !movieId || rating === undefined || rating === null) {
      return res
        .status(400)
        .json({ error: "User ID, Movie ID, and Rating are all required." });
    }

    // Convert to integers
    const userIdNum = parseInt(userId, 10);
    const movieIdNum = parseInt(movieId, 10);
    const ratingNum = parseInt(rating, 10);

    if (isNaN(userIdNum) || isNaN(movieIdNum) || isNaN(ratingNum)) {
      return res.status(400).json({ error: "User ID, Movie ID, and Rating must be valid numbers." });
    }

    // Validate rating is between 1 and 5
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // Check if rating already exists
    const existing = await query(
      "SELECT id FROM ratings WHERE user_id = $1 AND movie_id = $2",
      [userIdNum, movieIdNum]
    );

    if (existing.rows.length > 0) {
      // Update existing rating
      await query(
        "UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND movie_id = $3",
        [ratingNum, userIdNum, movieIdNum]
      );
      res.json({
        success: true,
        message: "Rating updated successfully",
      });
    } else {
      // Insert new rating
      await query(
        "INSERT INTO ratings (user_id, movie_id, rating) VALUES ($1, $2, $3) RETURNING id",
        [userIdNum, movieIdNum, ratingNum]
      );
      res.status(201).json({
        success: true,
        message: "Rating saved successfully",
      });
    }
  } catch (error) {
    console.error("Error saving rating:", error);
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes("does not exist")) {
      return res.status(500).json({ 
        error: "Database tables not initialized. Please run: npm run init-db in the backend folder" 
      });
    }
    res.status(500).json({ error: `Failed to save rating: ${error.message}` });
  }
});

// GET /api/ratings/:movieId - Get all ratings for a movie with average
app.get("/api/ratings/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    // Get average rating and count
    const avgResult = await query(
      "SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE movie_id = $1",
      [movieId]
    );

    // Get all individual ratings with user info
    const ratingsResult = await query(
      `SELECT r.id, r.user_id, r.rating, r.created_at, r.updated_at, u.username 
       FROM ratings r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.movie_id = $1 
       ORDER BY r.created_at DESC`,
      [movieId]
    );

    const average = avgResult.rows[0].average
      ? parseFloat(avgResult.rows[0].average).toFixed(1)
      : null;
    const count = parseInt(avgResult.rows[0].count) || 0;

    res.json({
      average: average ? parseFloat(average) : null,
      count,
      ratings: ratingsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

// GET /api/ratings/:movieId/:userId - Get user's specific rating for a movie
app.get("/api/ratings/:movieId/:userId", async (req, res) => {
  try {
    const { movieId, userId } = req.params;

    const result = await query(
      "SELECT id, rating, created_at, updated_at FROM ratings WHERE movie_id = $1 AND user_id = $2",
      [movieId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({ rating: null });
    }

    res.json({ rating: result.rows[0].rating });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({ error: "Failed to fetch user rating" });
  }
});

// POST /api/comments - Create a new comment
app.post("/api/comments", async (req, res) => {
  try {
    const { userId, movieId, commentText } = req.body || {};

    if (!userId || !movieId || !commentText) {
      return res
        .status(400)
        .json({ error: "User ID, Movie ID, and Comment text are all required." });
    }

    if (typeof commentText !== "string" || commentText.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }

    // Convert to integers
    const userIdNum = parseInt(userId, 10);
    const movieIdNum = parseInt(movieId, 10);

    if (isNaN(userIdNum) || isNaN(movieIdNum)) {
      return res.status(400).json({ error: "User ID and Movie ID must be valid numbers." });
    }

    const result = await query(
      `INSERT INTO comments (user_id, movie_id, comment_text) 
       VALUES ($1, $2, $3) 
       RETURNING id, user_id, movie_id, comment_text, created_at, updated_at`,
      [userIdNum, movieIdNum, commentText.trim()]
    );

    // Get username for the response
    const userResult = await query("SELECT username FROM users WHERE id = $1", [userIdNum]);
    const username = userResult.rows[0]?.username || "Unknown";

    res.status(201).json({
      success: true,
      comment: {
        ...result.rows[0],
        username,
      },
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes("does not exist")) {
      return res.status(500).json({ 
        error: "Database tables not initialized. Please run: npm run init-db in the backend folder" 
      });
    }
    res.status(500).json({ error: `Failed to create comment: ${error.message}` });
  }
});

// GET /api/comments/:movieId - Get all comments for a movie
app.get("/api/comments/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    const result = await query(
      `SELECT c.id, c.user_id, c.comment_text, c.created_at, c.updated_at, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.movie_id = $1 
       ORDER BY c.created_at ASC`,
      [movieId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// PUT /api/comments/:commentId - Update a comment (only if user owns it)
app.put("/api/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, commentText } = req.body || {};

    if (!userId || !commentText) {
      return res
        .status(400)
        .json({ error: "User ID and Comment text are required." });
    }

    if (commentText.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }

    // Check if comment exists and belongs to user
    const existing = await query(
      "SELECT id, user_id FROM comments WHERE id = $1",
      [commentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existing.rows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }

    // Update comment
    const result = await query(
      `UPDATE comments 
       SET comment_text = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, user_id, movie_id, comment_text, created_at, updated_at`,
      [commentText.trim(), commentId]
    );

    // Get username for response
    const userResult = await query("SELECT username FROM users WHERE id = $1", [userId]);
    const username = userResult.rows[0]?.username || "Unknown";

    res.json({
      success: true,
      comment: {
        ...result.rows[0],
        username,
      },
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// DELETE /api/comments/:commentId - Delete a comment (only if user owns it)
app.delete("/api/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Check if comment exists and belongs to user
    const existing = await query(
      "SELECT id, user_id FROM comments WHERE id = $1",
      [commentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existing.rows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    // Delete comment
    await query("DELETE FROM comments WHERE id = $1", [commentId]);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// GET /api/users/:userId - Get user profile
app.get("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT id, username, email, profile_picture_url, theme_preference, created_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// PUT /api/users/:userId - Update user profile
app.put("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password, profilePictureUrl, themePreference } = req.body || {};

    // Check if user exists
    const existingUser = await query("SELECT id, username FROM users WHERE id = $1", [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Update username if provided
    if (username !== undefined) {
      const normalizedUsername = username.toLowerCase().trim();
      if (normalizedUsername.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters." });
      }
      
      // Check if username is already taken by another user
      const usernameCheck = await query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [normalizedUsername, userId]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({ error: "Username already taken." });
      }

      updates.push(`username = $${paramCount++}`);
      values.push(normalizedUsername);
    }

    // Update email if provided
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.trim() || null);
    }

    // Update password if provided
    if (password !== undefined) {
      const normalizedPassword = password.trim();
      if (normalizedPassword.length < 3) {
        return res.status(400).json({ error: "Password must be at least 3 characters." });
      }
      updates.push(`password = $${paramCount++}`);
      values.push(normalizedPassword);
    }

    // Update profile picture if provided
    if (profilePictureUrl !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(profilePictureUrl.trim() || null);
    }

    // Update theme preference if provided
    if (themePreference !== undefined) {
      const validThemes = ['normal', 'dark', 'light', 'red', 'blue', 'christmas', 'halloween', 'stranger', 'custom'];
      if (!validThemes.includes(themePreference)) {
        return res.status(400).json({ error: "Invalid theme preference." });
      }
      updates.push(`theme_preference = $${paramCount++}`);
      values.push(themePreference);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, email, profile_picture_url, theme_preference`;
    
    const result = await query(updateQuery, values);

    res.json({
      success: true,
      user: result.rows[0],
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/users/:userId/ratings - Get user's past ratings
app.get("/api/users/:userId/ratings", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT r.id, r.movie_id, r.rating, r.created_at, r.updated_at, m.title, m.year, m.genre
       FROM ratings r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = $1
       ORDER BY r.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ error: "Failed to fetch user ratings" });
  }
});

// GET /api/users/:userId/comments - Get user's past comments
app.get("/api/users/:userId/comments", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT c.id, c.movie_id, c.comment_text, c.created_at, c.updated_at, m.title, m.year, m.genre
       FROM comments c
       JOIN movies m ON c.movie_id = m.id
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({ error: "Failed to fetch user comments" });
  }
});

// POST /api/movies/:id/update-imdb-rating - Manually update IMDB rating for a movie
app.post("/api/movies/:id/update-imdb-rating", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get movie details
    const movieResult = await query(
      "SELECT id, title, year FROM movies WHERE id = $1",
      [id]
    );

    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const movie = movieResult.rows[0];
    
    // Update rating
    const result = await updateMovieRating(movie.id, movie.title, movie.year);

    if (result.success) {
      res.json({
        success: true,
        rating: result.rating,
        message: `IMDB rating updated: ${result.rating}/10`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to update rating",
      });
    }
  } catch (error) {
    console.error("Error updating IMDB rating:", error);
    res.status(500).json({ error: "Failed to update IMDB rating" });
  }
});

// POST /api/movies/update-all-imdb-ratings - Update IMDB ratings for all movies (admin endpoint)
app.post("/api/movies/update-all-imdb-ratings", async (req, res) => {
  try {
    // This could be a long-running operation, so we'll start it and return immediately
    // In production, you might want to use a job queue system
    
    res.json({
      message: "IMDB rating update started. Check server logs for progress.",
      status: "processing",
    });

    // Run update in background (don't await)
    updateAllMovieRatings(10, 2000)
      .then((result) => {
        console.log("✅ Background rating update completed:", result);
      })
      .catch((error) => {
        console.error("❌ Background rating update failed:", error);
      });
  } catch (error) {
    console.error("Error starting IMDB rating update:", error);
    res.status(500).json({ error: "Failed to start rating update" });
  }
});

// GET /api/imdb/stats - Get IMDB API usage statistics
app.get("/api/imdb/stats", async (req, res) => {
  try {
    const stats = getDailyRequestCount();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching IMDB stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/movies/:id/update-poster - Manually update poster URL for a movie
app.post("/api/movies/:id/update-poster", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get movie details
    const movieResult = await query(
      "SELECT id, title, year FROM movies WHERE id = $1",
      [id]
    );

    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const movie = movieResult.rows[0];
    
    // Update poster
    const result = await updateMoviePoster(movie.id, movie.title, movie.year);

    if (result.success) {
      res.json({
        success: true,
        posterUrl: result.posterUrl,
        message: `Poster updated successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to update poster",
      });
    }
  } catch (error) {
    console.error("Error updating movie poster:", error);
    res.status(500).json({ error: "Failed to update movie poster" });
  }
});

// POST /api/movies/update-all-posters - Update poster URLs for all movies missing posters (admin endpoint)
app.post("/api/movies/update-all-posters", async (req, res) => {
  try {
    res.json({
      message: "Poster update started. Check server logs for progress.",
      status: "processing",
    });

    // Run update in background (don't await)
    updateAllMoviePosters(5, 2000)
      .then((result) => {
        console.log("✅ Background poster update completed:", result);
      })
      .catch((error) => {
        console.error("❌ Background poster update failed:", error);
      });
  } catch (error) {
    console.error("Error starting poster update:", error);
    res.status(500).json({ error: "Failed to start poster update" });
  }
});

// GET /api/movies/:id/actors - Get actors/cast for a movie
app.get("/api/movies/:id/actors", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify movie exists
    const movieResult = await query(
      "SELECT id FROM movies WHERE id = $1",
      [id]
    );
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    
    // Fetch actors from database
    const actors = await fetchMovieActors(id);
    
    res.json({
      movieId: parseInt(id),
      actors: actors,
    });
  } catch (error) {
    console.error("Error fetching movie actors:", error);
    res.status(500).json({ error: "Failed to fetch movie actors" });
  }
});

// ============================================
// BOOKING SYSTEM ENDPOINTS
// ============================================

// GET /api/movies/now-playing - Fetch now playing movies from TMDB
app.get("/api/movies/now-playing", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === "MY_KEY_HERE" || apiKey === "my_real_key" || apiKey.trim() === "") {
      console.warn("⚠️  /api/movies/now-playing called but TMDB_API_KEY is not set");
      return res.status(503).json({ 
        error: "TMDB_API_KEY not configured",
        message: "Please add TMDB_API_KEY to backend/.env file. Get your free key from https://www.themoviedb.org/settings/api"
      });
    }
    const movies = await fetchNowPlayingMovies();
    if (movies.length === 0) {
      console.warn("⚠️  TMDB API returned empty array for now playing movies");
    }
    res.json(movies);
  } catch (error) {
    console.error("Error fetching now playing movies:", error);
    res.status(500).json({ 
      error: "Failed to fetch now playing movies",
      details: error.message 
    });
  }
});

// GET /api/movies/upcoming - Fetch upcoming movies from TMDB
app.get("/api/movies/upcoming", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === "MY_KEY_HERE" || apiKey === "my_real_key" || apiKey.trim() === "") {
      console.warn("⚠️  /api/movies/upcoming called but TMDB_API_KEY is not set");
      return res.status(503).json({ 
        error: "TMDB_API_KEY not configured",
        message: "Please add TMDB_API_KEY to backend/.env file. Get your free key from https://www.themoviedb.org/settings/api"
      });
    }
    const movies = await fetchUpcomingMovies();
    if (movies.length === 0) {
      console.warn("⚠️  TMDB API returned empty array for upcoming movies");
    }
    res.json(movies);
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
    res.status(500).json({ 
      error: "Failed to fetch upcoming movies",
      details: error.message 
    });
  }
});

// GET /api/tmdb/status - Check TMDB API configuration status
app.get("/api/tmdb/status", (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  const hasKey = apiKey && apiKey !== "MY_KEY_HERE" && apiKey !== "my_real_key" && apiKey.trim() !== "";
  res.json({
    configured: hasKey,
    keyLength: hasKey ? apiKey.length : 0,
    message: hasKey 
      ? "TMDB API key is configured" 
      : "TMDB_API_KEY is not set in .env file. Get your free key from https://www.themoviedb.org/settings/api"
  });
});

// GET /api/snacks - Fetch all available snacks
app.get("/api/snacks", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM snacks WHERE available = true ORDER BY category, name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching snacks:", error);
    res.status(500).json({ error: "Failed to fetch snacks" });
  }
});

// POST /api/showings - Create a showing for a movie
app.post("/api/showings", async (req, res) => {
  try {
    const { movieId, tmdbId, showtime, theaterName = "Main Theater", totalSeats = 80 } = req.body;

    if ((!movieId && !tmdbId) || !showtime) {
      return res.status(400).json({ error: "movieId or tmdbId and showtime are required" });
    }

    let dbMovieId = movieId;

    // If tmdbId is provided, find or create movie in database
    if (tmdbId && !movieId) {
      // Check if movie exists with this tmdb_id
      const existingMovie = await query(
        "SELECT id FROM movies WHERE tmdb_id = $1",
        [tmdbId]
      );

      if (existingMovie.rows.length > 0) {
        dbMovieId = existingMovie.rows[0].id;
      } else {
        // Check if this is a fake 2025 movie ID (2025xxx format)
        // For these, we need movie data from the request body
        if (tmdbId >= 2025000 && tmdbId < 2026000) {
          // This is a 2025 movie - check if we have movie data in request
          const { movieTitle, movieYear, movieGenre, movieDescription, moviePoster } = req.body;
          
          if (movieTitle) {
            // Create movie from provided data
            const newMovieResult = await query(
              `INSERT INTO movies (title, year, genre, description, poster_url, tmdb_id, release_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id`,
              [
                movieTitle,
                movieYear || new Date().getFullYear(),
                movieGenre || "Unknown",
                movieDescription || "",
                moviePoster || null,
                tmdbId,
                null,
              ]
            );
            dbMovieId = newMovieResult.rows[0].id;
          } else {
            return res.status(400).json({ error: "Movie data required for 2025 movies. Please provide movieTitle, movieYear, movieGenre, movieDescription, and moviePoster in request body." });
          }
        } else {
          // Real TMDB ID - fetch from TMDB API
          const tmdbMovie = await getMovieDetails(tmdbId);
          
          if (tmdbMovie) {
            const newMovieResult = await query(
              `INSERT INTO movies (title, year, genre, description, poster_url, tmdb_id, release_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id`,
              [
                tmdbMovie.title,
                tmdbMovie.releaseDate ? new Date(tmdbMovie.releaseDate).getFullYear() : new Date().getFullYear(),
                tmdbMovie.genres && tmdbMovie.genres.length > 0 ? tmdbMovie.genres[0].name : "Unknown",
                tmdbMovie.overview || "",
                tmdbMovie.posterPath || null,
                tmdbId,
                tmdbMovie.releaseDate || null,
              ]
            );
            dbMovieId = newMovieResult.rows[0].id;
          } else {
            return res.status(404).json({ error: "Movie not found in TMDB" });
          }
        }
      }
    }

    // Verify movie exists before creating showing
    if (dbMovieId) {
      const movieCheck = await query("SELECT id FROM movies WHERE id = $1", [dbMovieId]);
      if (movieCheck.rows.length === 0) {
        return res.status(404).json({ error: `Movie with ID ${dbMovieId} not found in database` });
      }
    }

    // Create showing
    const showingResult = await query(
      `INSERT INTO showings (movie_id, showtime, theater_name, total_seats)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dbMovieId, showtime, theaterName, totalSeats]
    );

    const showing = showingResult.rows[0];

    // Create seats for this showing (8 rows × 10 seats = 80 seats)
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 10;
    const seatPrice = 12.00; // Standard seat price

    for (const row of rows) {
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        await query(
          `INSERT INTO seats (showing_id, row_label, seat_number, seat_type, price, is_reserved)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [showing.id, row, seatNum, "standard", seatPrice, false]
        );
      }
    }

    // Randomly reserve some seats for demo (about 20% of seats)
    const totalSeatsCreated = rows.length * seatsPerRow;
    const reservedCount = Math.floor(totalSeatsCreated * 0.2);
    const seatIds = await query(
      "SELECT id FROM seats WHERE showing_id = $1 ORDER BY RANDOM() LIMIT $2",
      [showing.id, reservedCount]
    );

    for (const seat of seatIds.rows) {
      await query("UPDATE seats SET is_reserved = true WHERE id = $1", [seat.id]);
    }

    res.json(showing);
  } catch (error) {
    console.error("Error creating showing:", error);
    res.status(500).json({ error: "Failed to create showing" });
  }
});

// GET /api/showings/:movieId - Get showings for a movie (by database ID or TMDB ID)
app.get("/api/showings/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Try to find movie by database ID first
    let dbMovieId = parseInt(movieId);
    
    // If not a valid number, try to find by TMDB ID
    if (isNaN(dbMovieId)) {
      const movieResult = await query(
        "SELECT id FROM movies WHERE tmdb_id = $1",
        [movieId]
      );
      if (movieResult.rows.length > 0) {
        dbMovieId = movieResult.rows[0].id;
      } else {
        return res.json([]); // No movie found, return empty array
      }
    }
    
    const result = await query(
      `SELECT * FROM showings 
       WHERE movie_id = $1 
       AND showtime > NOW()
       ORDER BY showtime ASC`,
      [dbMovieId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching showings:", error);
    res.status(500).json({ error: "Failed to fetch showings" });
  }
});

// GET /api/showings/:showingId/seats - Get seats for a showing
app.get("/api/showings/:showingId/seats", async (req, res) => {
  try {
    const { showingId } = req.params;
    const result = await query(
      `SELECT * FROM seats 
       WHERE showing_id = $1 
       ORDER BY row_label, seat_number`,
      [showingId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

// POST /api/bookings - Create a booking
app.post("/api/bookings", async (req, res) => {
  try {
    const { userId, movieId, showingId, seatIds, snacks, totalAmount } = req.body;

    if (!userId || !movieId || !showingId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: "userId, movieId, showingId, and seatIds are required" });
    }

    // Generate booking reference
    const bookingReference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create booking
    const bookingResult = await query(
      `INSERT INTO bookings (user_id, movie_id, showing_id, total_amount, booking_reference, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, movieId, showingId, totalAmount || 0, bookingReference, "confirmed"]
    );

    const booking = bookingResult.rows[0];

    // Reserve seats
    for (const seatId of seatIds) {
      // Add seat to booking_seats
      await query(
        `INSERT INTO booking_seats (booking_id, seat_id)
         VALUES ($1, $2)`,
        [booking.id, seatId]
      );

      // Mark seat as reserved
      await query(
        `UPDATE seats SET is_reserved = true WHERE id = $1`,
        [seatId]
      );
    }

    // Add snacks if provided
    if (snacks && Array.isArray(snacks) && snacks.length > 0) {
      for (const snack of snacks) {
        const snackData = await query("SELECT price FROM snacks WHERE id = $1", [snack.snackId]);
        const snackPrice = snackData.rows[0]?.price || 0;

        await query(
          `INSERT INTO booking_snacks (booking_id, snack_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [booking.id, snack.snackId, snack.quantity, snackPrice]
        );
      }
    }

    res.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/bookings/user/:userId - Get user's bookings
app.get("/api/bookings/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT 
        b.*,
        m.title as movie_title,
        m.poster_url as movie_poster,
        s.showtime,
        s.theater_name
       FROM bookings b
       JOIN movies m ON b.movie_id = m.id
       JOIN showings s ON b.showing_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(
    `📊 Database endpoints ready: /api/movies, /api/login, /api/signup, /api/favourites, /api/watchlist, /api/ratings, /api/comments, /api/users`
  );
  console.log(`🎬 IMDB endpoints ready: /api/movies/:id/update-imdb-rating, /api/movies/update-all-imdb-ratings, /api/imdb/stats`);
  console.log(`🖼️  Poster endpoints ready: /api/movies/:id/update-poster, /api/movies/update-all-posters`);
  console.log(`🎭 Actor endpoints ready: /api/movies/:id/actors`);
  console.log(`🎫 Booking endpoints ready: /api/movies/now-playing, /api/movies/upcoming, /api/snacks, /api/showings, /api/bookings`);
  
  // Start the scheduler for automatic daily updates
  startScheduler();
});
