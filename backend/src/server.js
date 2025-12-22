require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { query } = require("./db");
const { updateMovieRating, updateAllMovieRatings, getDailyRequestCount } = require("./imdbService");
const { updateMoviePoster, updateAllMoviePosters } = require("./posterService");
const { fetchMovieActors } = require("./actorService");
const { startScheduler } = require("./scheduler");
const { fetchNowPlayingMovies, fetchUpcomingMovies, getMovieDetails } = require("./tmdbService");
const { uploadToCloudinary, deleteFromCloudinary, testCloudinaryConnection } = require("./cloudinaryService");
const { requireAdmin, logAdminAction, isAdmin } = require("./adminMiddleware");
const { checkProfanity, filterProfanity, checkAndFilter } = require("./profanityFilter");
const { getCachedRecommendations } = require("./recommendationService");
const {
  getQuizQuestions,
  createOrUpdateQuiz,
  submitQuizResult,
  getUserQuizResults,
  getMovieQuizStats,
  getAllQuizzes,
  getQuizById,
  deleteQuiz,
  deleteQuestionFromQuiz,
  getAllQuizResults,
  getQuizStatisticsOverview,
} = require("./quizService");
const {
  getOrCreateDailyBattle,
  submitVote,
  hasUserVoted,
  getYesterdayWinner,
  getMonthlyLeader,
  getMovieBattleStats,
  getBattleLeaderboard,
} = require("./battleService");
const {
  getTrendingMovies,
  getAllTrendingMovies,
  submitVote: submitTrendingVote,
  addTrendingMovie,
  getUserVotingStatus,
} = require("./trendingService");
const axios = require("axios");

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

// Test Cloudinary connection on server start
(async () => {
  try {
    const isConnected = await testCloudinaryConnection();
    if (isConnected) {
      console.log("✅ Cloudinary connection successful");
    } else {
      console.warn("⚠️  WARNING: Cloudinary connection test failed!");
      console.warn("   Please check your CLOUDINARY_URL or CLOUDINARY credentials in .env file");
    }
  } catch (error) {
    console.warn("⚠️  WARNING: Could not test Cloudinary connection:", error.message);
  }
})();

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS to allow frontend access
// Support both development and production origins
const allowedOrigins = [
  "http://localhost:5173", // Vite default port
  "http://localhost:3000", // Alternative React port
  "http://localhost:5174", // Vite alternative port
];

// Add production origins from environment variable (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
  const productionOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...productionOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Configure multer for file uploads (store in memory for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

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

    // Check for profanity
    const trimmedText = commentText.trim();
    const profanityCheck = checkAndFilter(trimmedText);
    const displayText = profanityCheck.containsProfanity 
      ? profanityCheck.filteredText 
      : trimmedText;

    // Insert comment with original text and flag if profanity detected
    const result = await query(
      `INSERT INTO comments (user_id, movie_id, comment_text, original_text, is_flagged, flagged_reason) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, user_id, movie_id, comment_text, created_at, updated_at, is_flagged`,
      [
        userIdNum, 
        movieIdNum, 
        displayText, // Display filtered text
        profanityCheck.originalText, // Store original
        profanityCheck.containsProfanity,
        profanityCheck.containsProfanity 
          ? `Flagged words: ${profanityCheck.flaggedWords.join(", ")}` 
          : null
      ]
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
      `SELECT id, username, email, profile_picture_url, theme_preference, created_at, 
       COALESCE(is_admin, false) as is_admin, 
       COALESCE(is_banned, false) as is_banned
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

// ==================== Cloudinary Upload Endpoints ====================

// POST /api/upload - Upload a single file to Cloudinary
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { folder, public_id } = req.body || {};
    const uploadOptions = {
      folder: folder || "lecture-project",
      public_id: public_id || undefined,
    };

    // Convert buffer to data URI for Cloudinary
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    
    const result = await uploadToCloudinary(dataUri, uploadOptions);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to upload file" 
    });
  }
});

// POST /api/upload/multiple - Upload multiple files to Cloudinary
app.post("/api/upload/multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const { folder } = req.body || {};
    const uploadOptions = {
      folder: folder || "lecture-project",
    };

    const uploadPromises = req.files.map((file) => {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      return uploadToCloudinary(dataUri, uploadOptions);
    });

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${results.length} file(s) uploaded successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to upload files" 
    });
  }
});

// DELETE /api/upload/:publicId - Delete a file from Cloudinary
app.delete("/api/upload/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query || {};

    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required" });
    }

    const result = await deleteFromCloudinary(publicId, resourceType || "image");

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
        data: result,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "File not found or already deleted",
        data: result,
      });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to delete file" 
    });
  }
});

// GET /api/upload/test - Test Cloudinary connection
app.get("/api/upload/test", async (req, res) => {
  try {
    const isConnected = await testCloudinaryConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: "Cloudinary connection successful",
        connected: true,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Cloudinary connection failed",
        connected: false,
      });
    }
  } catch (error) {
    console.error("Error testing Cloudinary connection:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to test Cloudinary connection" 
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// ========== Movie Management ==========

// POST /api/admin/movies - Create a new movie (with Cloudinary upload)
app.post("/api/admin/movies", requireAdmin, upload.fields([{ name: "poster", maxCount: 1 }, { name: "trailer", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, year, genre, description, duration, userId } = req.body;
    const adminId = parseInt(userId, 10);

    if (!title || !year || !genre) {
      return res.status(400).json({ error: "Title, year, and genre are required" });
    }

    let posterUrl = null;
    let trailerUrl = null;

    // Upload poster if provided
    if (req.files && req.files.poster && req.files.poster[0]) {
      const posterFile = req.files.poster[0];
      const dataUri = `data:${posterFile.mimetype};base64,${posterFile.buffer.toString("base64")}`;
      const uploadResult = await uploadToCloudinary(dataUri, { folder: "movie-posters" });
      posterUrl = uploadResult.url;
    }

    // Upload trailer if provided
    if (req.files && req.files.trailer && req.files.trailer[0]) {
      const trailerFile = req.files.trailer[0];
      const dataUri = `data:${trailerFile.mimetype};base64,${trailerFile.buffer.toString("base64")}`;
      const uploadResult = await uploadToCloudinary(dataUri, { folder: "movie-trailers", resource_type: "video" });
      trailerUrl = uploadResult.url;
    }

    const result = await query(
      `INSERT INTO movies (title, year, genre, description, duration, poster_url, trailer_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, parseInt(year), genre, description || null, duration ? parseInt(duration) : null, posterUrl, trailerUrl]
    );

    await logAdminAction(adminId, "CREATE_MOVIE", "movie", result.rows[0].id, `Created movie: ${title}`);

    res.status(201).json({
      success: true,
      movie: result.rows[0],
      message: "Movie created successfully",
    });
  } catch (error) {
    console.error("Error creating movie:", error);
    res.status(500).json({ error: "Failed to create movie" });
  }
});

// PUT /api/admin/movies/:id - Update a movie
app.put("/api/admin/movies/:id", requireAdmin, upload.fields([{ name: "poster", maxCount: 1 }, { name: "trailer", maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, year, genre, description, duration, userId, poster_url, trailer_url } = req.body;
    const adminId = parseInt(userId, 10);

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (year) { updates.push(`year = $${paramCount++}`); values.push(parseInt(year)); }
    if (genre) { updates.push(`genre = $${paramCount++}`); values.push(genre); }
    if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (duration !== undefined) { updates.push(`duration = $${paramCount++}`); values.push(duration ? parseInt(duration) : null); }

    // Handle poster upload
    if (req.files && req.files.poster && req.files.poster[0]) {
      const posterFile = req.files.poster[0];
      const dataUri = `data:${posterFile.mimetype};base64,${posterFile.buffer.toString("base64")}`;
      const uploadResult = await uploadToCloudinary(dataUri, { folder: "movie-posters" });
      updates.push(`poster_url = $${paramCount++}`);
      values.push(uploadResult.url);
    } else if (poster_url !== undefined) {
      updates.push(`poster_url = $${paramCount++}`);
      values.push(poster_url);
    }

    // Handle trailer upload
    if (req.files && req.files.trailer && req.files.trailer[0]) {
      const trailerFile = req.files.trailer[0];
      const dataUri = `data:${trailerFile.mimetype};base64,${trailerFile.buffer.toString("base64")}`;
      const uploadResult = await uploadToCloudinary(dataUri, { folder: "movie-trailers", resource_type: "video" });
      updates.push(`trailer_url = $${paramCount++}`);
      values.push(uploadResult.url);
    } else if (trailer_url !== undefined) {
      updates.push(`trailer_url = $${paramCount++}`);
      values.push(trailer_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE movies SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    await logAdminAction(adminId, "UPDATE_MOVIE", "movie", parseInt(id), `Updated movie: ${result.rows[0].title}`);

    res.json({
      success: true,
      movie: result.rows[0],
      message: "Movie updated successfully",
    });
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// DELETE /api/admin/movies/:id - Delete a movie
app.delete("/api/admin/movies/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);

    // Get movie info for logging
    const movieResult = await query("SELECT title FROM movies WHERE id = $1", [id]);
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    await query("DELETE FROM movies WHERE id = $1", [id]);
    await logAdminAction(adminId, "DELETE_MOVIE", "movie", parseInt(id), `Deleted movie: ${movieResult.rows[0].title}`);

    res.json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// ========== Ticket/Showing Management ==========

// GET /api/admin/showings - Get all showings with movie info
app.get("/api/admin/showings", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, m.title as movie_title, m.poster_url, m.genre,
       (SELECT COUNT(*) FROM seats WHERE showing_id = s.id AND is_reserved = true) as reserved_seats,
       (SELECT COUNT(*) FROM seats WHERE showing_id = s.id) as total_seats
       FROM showings s
       JOIN movies m ON s.movie_id = m.id
       ORDER BY s.showtime DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching showings:", error);
    res.status(500).json({ error: "Failed to fetch showings" });
  }
});

// POST /api/admin/showings - Create a new showing
app.post("/api/admin/showings", requireAdmin, async (req, res) => {
  try {
    const { movieId, showtime, theaterName, totalSeats, userId } = req.body;
    const adminId = parseInt(userId, 10);

    if (!movieId || !showtime) {
      return res.status(400).json({ error: "Movie ID and showtime are required" });
    }

    const result = await query(
      `INSERT INTO showings (movie_id, showtime, theater_name, total_seats)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [movieId, showtime, theaterName || "Main Theater", totalSeats || 80]
    );

    await logAdminAction(adminId, "CREATE_SHOWING", "showing", result.rows[0].id, `Created showing for movie ${movieId}`);

    res.status(201).json({
      success: true,
      showing: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating showing:", error);
    res.status(500).json({ error: "Failed to create showing" });
  }
});

// PUT /api/admin/showings/:id - Update a showing
app.put("/api/admin/showings/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { showtime, theaterName, totalSeats, userId } = req.body;
    const adminId = parseInt(userId, 10);

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (showtime) { updates.push(`showtime = $${paramCount++}`); values.push(showtime); }
    if (theaterName) { updates.push(`theater_name = $${paramCount++}`); values.push(theaterName); }
    if (totalSeats) { updates.push(`total_seats = $${paramCount++}`); values.push(parseInt(totalSeats)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const result = await query(
      `UPDATE showings SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Showing not found" });
    }

    await logAdminAction(adminId, "UPDATE_SHOWING", "showing", parseInt(id), `Updated showing ${id}`);

    res.json({
      success: true,
      showing: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating showing:", error);
    res.status(500).json({ error: "Failed to update showing" });
  }
});

// DELETE /api/admin/showings/:id - Delete a showing
app.delete("/api/admin/showings/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);

    await query("DELETE FROM showings WHERE id = $1", [id]);
    await logAdminAction(adminId, "DELETE_SHOWING", "showing", parseInt(id), `Deleted showing ${id}`);

    res.json({
      success: true,
      message: "Showing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting showing:", error);
    res.status(500).json({ error: "Failed to delete showing" });
  }
});

// GET /api/admin/bookings - Get all bookings with details
app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, m.title as movie_title, u.username, u.email as user_email, s.showtime, s.theater_name
       FROM bookings b
       JOIN movies m ON b.movie_id = m.id
       JOIN users u ON b.user_id = u.id
       JOIN showings s ON b.showing_id = s.id
       ORDER BY b.booking_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// DELETE /api/admin/bookings/:id - Delete a booking (ticket) and notify n8n
app.delete("/api/admin/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;
    const adminId = parseInt(userId, 10);

    // Get full booking details before deletion
    const bookingResult = await query(
      `SELECT b.*, m.title as movie_title, u.username, u.email as user_email, s.showtime, s.theater_name
       FROM bookings b
       JOIN movies m ON b.movie_id = m.id
       JOIN users u ON b.user_id = u.id
       JOIN showings s ON b.showing_id = s.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    // Delete the booking
    await query("DELETE FROM bookings WHERE id = $1", [id]);
    
    // Log admin action
    await logAdminAction(
      adminId,
      "DELETE_BOOKING",
      "booking",
      parseInt(id),
      `Deleted booking ${id} for movie: ${booking.movie_title}`
    );

    // Send webhook notification to n8n
    // Use environment variable if set, otherwise use production webhook URL
    // Note: webhook-test only works when workflow is in test mode and executed once
    // For production, use the webhook URL without -test
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://tperadze.app.n8n.cloud/webhook/ticket-deleted";
    const webhookPayload = {
      ticketId: booking.id,
      bookingReference: booking.booking_reference,
      userId: booking.user_id,
      userEmail: booking.user_email || "",
      username: booking.username,
      movieId: booking.movie_id,
      movieTitle: booking.movie_title,
      showingId: booking.showing_id,
      showtime: booking.showtime,
      theaterName: booking.theater_name,
      totalAmount: booking.total_amount,
      bookingDate: booking.booking_date,
      status: booking.status,
      deletionReason: reason || "No reason provided",
      deletedBy: adminId,
      deletedAt: new Date().toISOString(),
    };

    console.log(`📤 Attempting to send n8n webhook for booking ${id}...`);
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Payload:`, JSON.stringify(webhookPayload, null, 2));

    try {
      const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      console.log(`✅ n8n webhook notification sent successfully for deleted booking ${id}`);
      console.log(`   Response status: ${webhookResponse.status}`);
      console.log(`   Response data:`, webhookResponse.data);
    } catch (webhookError) {
      console.error(`❌ Error sending n8n webhook for booking ${id}:`);
      if (webhookError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`   Status: ${webhookError.response.status}`);
        console.error(`   Data:`, webhookError.response.data);
        console.error(`   Headers:`, webhookError.response.headers);
      } else if (webhookError.request) {
        // The request was made but no response was received
        console.error(`   No response received from n8n webhook`);
        console.error(`   Request:`, webhookError.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`   Error:`, webhookError.message);
      }
      console.error(`   Full error:`, webhookError);
      // Don't fail the deletion if webhook fails, just log it
    }

    res.json({
      success: true,
      message: "Booking deleted successfully",
      webhookUrl: webhookUrl,
      webhookPayload: webhookPayload,
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// POST /api/admin/test-webhook - Test n8n webhook (admin only)
app.post("/api/admin/test-webhook", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);

    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://tperadze.app.n8n.cloud/webhook/ticket-deleted";
    const testPayload = {
      ticketId: 999,
      bookingReference: "TEST-BK-001",
      userId: 1,
      userEmail: "test@example.com",
      username: "testuser",
      movieId: 1,
      movieTitle: "Test Movie",
      showingId: 1,
      showtime: new Date().toISOString(),
      theaterName: "Test Theater",
      totalAmount: 25.50,
      bookingDate: new Date().toISOString(),
      status: "confirmed",
      deletionReason: "Test webhook",
      deletedBy: adminId,
      deletedAt: new Date().toISOString(),
    };

    console.log(`🧪 Testing n8n webhook...`);
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Payload:`, JSON.stringify(testPayload, null, 2));

    try {
      const webhookResponse = await axios.post(webhookUrl, testPayload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      console.log(`✅ Test webhook sent successfully`);
      console.log(`   Response status: ${webhookResponse.status}`);
      console.log(`   Response data:`, webhookResponse.data);

      res.json({
        success: true,
        message: "Test webhook sent successfully",
        webhookUrl: webhookUrl,
        response: {
          status: webhookResponse.status,
          data: webhookResponse.data,
        },
      });
    } catch (webhookError) {
      console.error(`❌ Test webhook failed:`);
      if (webhookError.response) {
        console.error(`   Status: ${webhookError.response.status}`);
        console.error(`   Data:`, webhookError.response.data);
        res.status(webhookError.response.status).json({
          success: false,
          error: "Webhook test failed",
          status: webhookError.response.status,
          data: webhookError.response.data,
        });
      } else if (webhookError.request) {
        console.error(`   No response received`);
        res.status(500).json({
          success: false,
          error: "No response from webhook",
          message: webhookError.message,
        });
      } else {
        console.error(`   Error:`, webhookError.message);
        res.status(500).json({
          success: false,
          error: "Webhook test error",
          message: webhookError.message,
        });
      }
    }
  } catch (error) {
    console.error("Error testing webhook:", error);
    res.status(500).json({ error: "Failed to test webhook" });
  }
});

// ========== User Management ==========

// GET /api/admin/users - Get all users with activity stats
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*,
       (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count,
       (SELECT COUNT(*) FROM ratings WHERE user_id = u.id) as rating_count,
       (SELECT COUNT(*) FROM favourites WHERE user_id = u.id) as favourite_count,
       (SELECT COUNT(*) FROM watchlist WHERE user_id = u.id) as watchlist_count,
       (SELECT COUNT(*) FROM user_warnings WHERE user_id = u.id) as warning_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/admin/users/:id/activity - Get user activity details
app.get("/api/admin/users/:id/activity", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [comments, ratings, favourites, watchlist, warnings] = await Promise.all([
      query(`SELECT c.*, m.title as movie_title FROM comments c JOIN movies m ON c.movie_id = m.id WHERE c.user_id = $1 ORDER BY c.created_at DESC`, [id]),
      query(`SELECT r.*, m.title as movie_title FROM ratings r JOIN movies m ON r.movie_id = m.id WHERE r.user_id = $1 ORDER BY r.created_at DESC`, [id]),
      query(`SELECT f.*, m.title as movie_title FROM favourites f JOIN movies m ON f.movie_id = m.id WHERE f.user_id = $1 ORDER BY f.created_at DESC`, [id]),
      query(`SELECT w.*, m.title as movie_title FROM watchlist w JOIN movies m ON w.movie_id = m.id WHERE w.user_id = $1 ORDER BY w.created_at DESC`, [id]),
      query(`SELECT * FROM user_warnings WHERE user_id = $1 ORDER BY created_at DESC`, [id]),
    ]);

    res.json({
      comments: comments.rows,
      ratings: ratings.rows,
      favourites: favourites.rows,
      watchlist: watchlist.rows,
      warnings: warnings.rows,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

// POST /api/admin/users/:id/ban - Ban or unban a user
app.post("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, banReason, bannedUntil, userId } = req.body;
    const adminId = parseInt(userId, 10);

    const updates = [];
    const values = [];
    let paramCount = 1;

    updates.push(`is_banned = $${paramCount++}`);
    values.push(isBanned || false);

    if (banReason) {
      updates.push(`ban_reason = $${paramCount++}`);
      values.push(banReason);
    } else {
      updates.push(`ban_reason = $${paramCount++}`);
      values.push(null);
    }

    if (bannedUntil) {
      updates.push(`banned_until = $${paramCount++}`);
      values.push(bannedUntil);
    } else {
      updates.push(`banned_until = $${paramCount++}`);
      values.push(null);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAction(
      adminId,
      isBanned ? "BAN_USER" : "UNBAN_USER",
      "user",
      parseInt(id),
      isBanned ? `Banned user: ${result.rows[0].username}` : `Unbanned user: ${result.rows[0].username}`
    );

    res.json({
      success: true,
      user: result.rows[0],
      message: isBanned ? "User banned successfully" : "User unbanned successfully",
    });
  } catch (error) {
    console.error("Error updating user ban status:", error);
    res.status(500).json({ error: "Failed to update user ban status" });
  }
});

// POST /api/admin/users/:id/warn - Warn a user
app.post("/api/admin/users/:id/warn", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { warningReason, userId } = req.body;
    const adminId = parseInt(userId, 10);

    if (!warningReason) {
      return res.status(400).json({ error: "Warning reason is required" });
    }

    const result = await query(
      `INSERT INTO user_warnings (user_id, warning_reason, warned_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, warningReason, adminId]
    );

    await logAdminAction(adminId, "WARN_USER", "user", parseInt(id), `Warned user ${id}: ${warningReason}`);

    res.status(201).json({
      success: true,
      warning: result.rows[0],
      message: "User warned successfully",
    });
  } catch (error) {
    console.error("Error warning user:", error);
    res.status(500).json({ error: "Failed to warn user" });
  }
});

// ========== Comments & Ratings Moderation ==========

// GET /api/admin/comments/flagged - Get all flagged comments
app.get("/api/admin/comments/flagged", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.username, m.title as movie_title
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN movies m ON c.movie_id = m.id
       WHERE c.is_flagged = true
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching flagged comments:", error);
    res.status(500).json({ error: "Failed to fetch flagged comments" });
  }
});

// GET /api/admin/comments - Get all comments with moderation info
app.get("/api/admin/comments", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.username, m.title as movie_title
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN movies m ON c.movie_id = m.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// DELETE /api/admin/comments/:id - Delete a comment
app.delete("/api/admin/comments/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);

    const commentResult = await query("SELECT * FROM comments WHERE id = $1", [id]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await query("DELETE FROM comments WHERE id = $1", [id]);
    await logAdminAction(adminId, "DELETE_COMMENT", "comment", parseInt(id), `Deleted comment ${id}`);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// POST /api/admin/comments/:id/unflag - Unflag a comment
app.post("/api/admin/comments/:id/unflag", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);

    const result = await query(
      `UPDATE comments SET is_flagged = false, flagged_reason = null WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await logAdminAction(adminId, "UNFLAG_COMMENT", "comment", parseInt(id), `Unflagged comment ${id}`);

    res.json({
      success: true,
      comment: result.rows[0],
      message: "Comment unflagged successfully",
    });
  } catch (error) {
    console.error("Error unflagging comment:", error);
    res.status(500).json({ error: "Failed to unflag comment" });
  }
});

// GET /api/admin/movies/:id/ratings - Get rating stats for a movie
app.get("/api/admin/movies/:id/ratings", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [stats, ratings] = await Promise.all([
      query(
        `SELECT 
         COUNT(*) as total_ratings,
         AVG(rating) as average_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
         FROM ratings WHERE movie_id = $1`,
        [id]
      ),
      query(
        `SELECT r.*, u.username FROM ratings r JOIN users u ON r.user_id = u.id WHERE r.movie_id = $1 ORDER BY r.created_at DESC`,
        [id]
      ),
    ]);

    res.json({
      stats: stats.rows[0],
      ratings: ratings.rows,
    });
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    res.status(500).json({ error: "Failed to fetch rating stats" });
  }
});

// ========== Watchlist & Favorites Overview ==========

// GET /api/admin/movies/popular - Get most favorited and watchlisted movies
app.get("/api/admin/movies/popular", requireAdmin, async (req, res) => {
  try {
    const [favourites, watchlist] = await Promise.all([
      query(
        `SELECT m.*, COUNT(f.id) as favourite_count
         FROM movies m
         LEFT JOIN favourites f ON m.id = f.movie_id
         GROUP BY m.id
         ORDER BY favourite_count DESC
         LIMIT 20`
      ),
      query(
        `SELECT m.*, COUNT(w.id) as watchlist_count
         FROM movies m
         LEFT JOIN watchlist w ON m.id = w.movie_id
         GROUP BY m.id
         ORDER BY watchlist_count DESC
         LIMIT 20`
      ),
    ]);

    res.json({
      mostFavourited: favourites.rows,
      mostWatchlisted: watchlist.rows,
    });
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

// GET /api/recommendations/:userId - Get personalized movie recommendations
app.get("/api/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const recommendations = await getCachedRecommendations(userIdNum);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// DELETE /api/admin/users/:userId/favourites/:movieId - Remove movie from user's favourites
app.delete("/api/admin/users/:userId/favourites/:movieId", requireAdmin, async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    const { userId: adminUserId } = req.body;
    const adminId = parseInt(adminUserId, 10);

    await query("DELETE FROM favourites WHERE user_id = $1 AND movie_id = $2", [userId, movieId]);
    await logAdminAction(adminId, "REMOVE_FAVOURITE", "favourite", parseInt(movieId), `Removed favourite from user ${userId}`);

    res.json({
      success: true,
      message: "Favourite removed successfully",
    });
  } catch (error) {
    console.error("Error removing favourite:", error);
    res.status(500).json({ error: "Failed to remove favourite" });
  }
});

// DELETE /api/admin/users/:userId/watchlist/:movieId - Remove movie from user's watchlist
app.delete("/api/admin/users/:userId/watchlist/:movieId", requireAdmin, async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    const { userId: adminUserId } = req.body;
    const adminId = parseInt(adminUserId, 10);

    await query("DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2", [userId, movieId]);
    await logAdminAction(adminId, "REMOVE_WATCHLIST", "watchlist", parseInt(movieId), `Removed watchlist item from user ${userId}`);

    res.json({
      success: true,
      message: "Watchlist item removed successfully",
    });
  } catch (error) {
    console.error("Error removing watchlist item:", error);
    res.status(500).json({ error: "Failed to remove watchlist item" });
  }
});

// ============================================
// MOVIE QUIZ ENDPOINTS
// ============================================

// GET /api/movies/:id/quiz - Get quiz questions for a movie from database
app.get("/api/movies/:id/quiz", async (req, res) => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    const questions = await getQuizQuestions(movieId);
    
    // Questions are now auto-generated if missing, so this should rarely happen
    if (!questions || questions.length === 0) {
      return res.status(404).json({ 
        error: "No quiz available for this movie",
        message: "Unable to generate quiz questions for this movie"
      });
    }
    
    res.json(questions);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    res.status(500).json({ 
      error: "Failed to fetch quiz questions",
      message: error.message 
    });
  }
});

// POST /api/movies/:id/quiz/submit - Submit quiz results
app.post("/api/movies/:id/quiz/submit", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, score, totalQuestions, answers } = req.body;
    
    const movieId = parseInt(id, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    if (score === undefined || totalQuestions === undefined) {
      return res.status(400).json({ error: "Missing required fields: score and totalQuestions" });
    }

    const result = await submitQuizResult(
      userId || null,
      movieId,
      parseInt(score),
      parseInt(totalQuestions),
      answers
    );

    res.json({
      success: true,
      result: {
        id: result.id,
        score: result.score,
        totalQuestions: result.total_questions,
        percentage: Math.round((result.score / result.total_questions) * 100),
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    res.status(500).json({ 
      error: "Failed to submit quiz result",
      message: error.message 
    });
  }
});

// POST /api/movies/:id/quiz/create - Admin endpoint to create/update quiz (for future admin panel)
app.post("/api/movies/:id/quiz/create", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    const movieId = parseInt(id, 10);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions must be a non-empty array" });
    }

    const quiz = await createOrUpdateQuiz(movieId, questions);
    
    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        movieId: quiz.movie_id,
        updatedAt: quiz.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating/updating quiz:", error);
    res.status(500).json({ 
      error: "Failed to create/update quiz",
      message: error.message 
    });
  }
});

// ============================================
// ADMIN QUIZ MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/quizzes - Get all quizzes with movie information
app.get("/api/admin/quizzes", requireAdmin, async (req, res) => {
  try {
    const quizzes = await getAllQuizzes();
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    res.status(500).json({ 
      error: "Failed to fetch quizzes",
      message: error.message 
    });
  }
});

// GET /api/admin/quizzes/:id - Get a specific quiz by ID
app.get("/api/admin/quizzes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const quizId = parseInt(id, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await getQuizById(quizId);
    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    if (error.message === "Quiz not found") {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.status(500).json({ 
      error: "Failed to fetch quiz",
      message: error.message 
    });
  }
});

// POST /api/admin/quizzes - Create a new quiz
app.post("/api/admin/quizzes", requireAdmin, async (req, res) => {
  try {
    const { movieId, questions } = req.body;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);
    
    if (!movieId) {
      return res.status(400).json({ error: "Movie ID is required" });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions must be a non-empty array" });
    }

    const quiz = await createOrUpdateQuiz(movieId, questions);
    await logAdminAction(adminId, "CREATE_QUIZ", "quiz", quiz.id, `Created quiz for movie ID ${movieId}`);
    
    res.status(201).json({
      success: true,
      quiz: {
        id: quiz.id,
        movieId: quiz.movie_id,
        updatedAt: quiz.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ 
      error: "Failed to create quiz",
      message: error.message 
    });
  }
});

// PUT /api/admin/quizzes/:id - Update a quiz
app.put("/api/admin/quizzes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);
    
    const quizId = parseInt(id, 10);
    if (isNaN(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    // Get the quiz to find movieId
    const existingQuiz = await getQuizById(quizId);
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions must be a non-empty array" });
    }

    const quiz = await createOrUpdateQuiz(existingQuiz.movieId, questions);
    await logAdminAction(adminId, "UPDATE_QUIZ", "quiz", quizId, `Updated quiz for movie ID ${existingQuiz.movieId}`);
    
    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        movieId: quiz.movie_id,
        updatedAt: quiz.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    if (error.message === "Quiz not found") {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.status(500).json({ 
      error: "Failed to update quiz",
      message: error.message 
    });
  }
});

// DELETE /api/admin/quizzes/:id - Delete a quiz
app.delete("/api/admin/quizzes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);
    
    const quizId = parseInt(id, 10);
    if (isNaN(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const result = await deleteQuiz(quizId);
    await logAdminAction(adminId, "DELETE_QUIZ", "quiz", quizId, `Deleted quiz ID ${quizId}`);
    
    res.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    if (error.message === "Quiz not found") {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.status(500).json({ 
      error: "Failed to delete quiz",
      message: error.message 
    });
  }
});

// DELETE /api/admin/quizzes/:id/questions/:questionIndex - Delete a specific question from a quiz
app.delete("/api/admin/quizzes/:id/questions/:questionIndex", requireAdmin, async (req, res) => {
  try {
    const { id, questionIndex } = req.params;
    const { userId } = req.body;
    const adminId = parseInt(userId, 10);
    
    const quizId = parseInt(id, 10);
    const qIndex = parseInt(questionIndex, 10);
    
    if (isNaN(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }
    if (isNaN(qIndex)) {
      return res.status(400).json({ error: "Invalid question index" });
    }

    const result = await deleteQuestionFromQuiz(quizId, qIndex);
    await logAdminAction(adminId, "DELETE_QUIZ_QUESTION", "quiz", quizId, `Deleted question ${qIndex} from quiz ${quizId}`);
    
    res.json({
      success: true,
      message: "Question deleted successfully",
      remainingQuestions: result.remainingQuestions,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    if (error.message === "Quiz not found" || error.message === "Question index out of range") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ 
      error: "Failed to delete question",
      message: error.message 
    });
  }
});

// GET /api/admin/quiz-results - Get all quiz results (read-only)
app.get("/api/admin/quiz-results", requireAdmin, async (req, res) => {
  try {
    const results = await getAllQuizResults();
    res.json(results);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    res.status(500).json({ 
      error: "Failed to fetch quiz results",
      message: error.message 
    });
  }
});

// GET /api/admin/quiz-statistics - Get quiz statistics overview
app.get("/api/admin/quiz-statistics", requireAdmin, async (req, res) => {
  try {
    const stats = await getQuizStatisticsOverview();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching quiz statistics:", error);
    res.status(500).json({ 
      error: "Failed to fetch quiz statistics",
      message: error.message 
    });
  }
});

// ============================================
// MOVIE BATTLE ENDPOINTS
// ============================================

// GET /api/movie-battle/current - Get or create today's battle (new endpoint)
app.get("/api/movie-battle/current", async (req, res) => {
  try {
    const battle = await getOrCreateDailyBattle();
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    
    let hasVoted = false;
    if (userId && !isNaN(userId)) {
      hasVoted = await hasUserVoted(battle.id, userId);
    }

    res.json({
      ...battle,
      hasVoted,
    });
  } catch (error) {
    console.error("Error fetching daily battle:", error);
    res.status(500).json({ 
      error: "Failed to fetch daily battle",
      message: error.message 
    });
  }
});

// GET /api/battle/daily - Get or create today's battle (backward compatibility)
app.get("/api/battle/daily", async (req, res) => {
  try {
    const battle = await getOrCreateDailyBattle();
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    
    let hasVoted = false;
    if (userId && !isNaN(userId)) {
      hasVoted = await hasUserVoted(battle.id, userId);
    }

    res.json({
      ...battle,
      hasVoted,
    });
  } catch (error) {
    console.error("Error fetching daily battle:", error);
    res.status(500).json({ 
      error: "Failed to fetch daily battle",
      message: error.message 
    });
  }
});

// POST /api/movie-battle/vote - Submit a vote (new endpoint)
app.post("/api/movie-battle/vote", async (req, res) => {
  try {
    const { battleId, userId, votedForMovieId } = req.body;

    if (!battleId || !votedForMovieId) {
      return res.status(400).json({ error: "Missing required fields: battleId and votedForMovieId" });
    }

    const userIdNum = userId ? parseInt(userId, 10) : null;
    const result = await submitVote(parseInt(battleId, 10), userIdNum, parseInt(votedForMovieId, 10));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ 
      error: "Failed to submit vote",
      message: error.message 
    });
  }
});

// POST /api/battle/vote - Submit a vote (backward compatibility)
app.post("/api/battle/vote", async (req, res) => {
  try {
    const { battleId, userId, votedForMovieId } = req.body;

    if (!battleId || !votedForMovieId) {
      return res.status(400).json({ error: "Missing required fields: battleId and votedForMovieId" });
    }

    const userIdNum = userId ? parseInt(userId, 10) : null;
    const result = await submitVote(parseInt(battleId, 10), userIdNum, parseInt(votedForMovieId, 10));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ 
      error: "Failed to submit vote",
      message: error.message 
    });
  }
});

// GET /api/movie-battle/leaderboard - Get battle leaderboard
app.get("/api/movie-battle/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await getBattleLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching battle leaderboard:", error);
    res.status(500).json({ 
      error: "Failed to fetch leaderboard",
      message: error.message 
    });
  }
});

// GET /api/battle/yesterday-winner - Get yesterday's winner (kept for backward compatibility)
app.get("/api/battle/yesterday-winner", async (req, res) => {
  try {
    const winner = await getYesterdayWinner();
    res.json(winner);
  } catch (error) {
    console.error("Error fetching yesterday's winner:", error);
    res.status(500).json({ 
      error: "Failed to fetch yesterday's winner",
      message: error.message 
    });
  }
});

// GET /api/battle/monthly-leader - Get current monthly leader
app.get("/api/battle/monthly-leader", async (req, res) => {
  try {
    const leader = await getMonthlyLeader();
    res.json(leader);
  } catch (error) {
    console.error("Error fetching monthly leader:", error);
    res.status(500).json({ 
      error: "Failed to fetch monthly leader",
      message: error.message 
    });
  }
});

// GET /api/battle/movie/:id/stats - Get battle stats for a movie
app.get("/api/battle/movie/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    const stats = await getMovieBattleStats(movieId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching movie battle stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch movie battle stats",
      message: error.message 
    });
  }
});

// ============================================
// TRENDING & POPULAR VOTING ENDPOINTS
// ============================================

// GET /api/trending-movies - Get trending movies with vote counts
app.get("/api/trending-movies", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    
    const movies = await getTrendingMovies(limit);
    
    // Get user's voting status if logged in
    let userVotes = {};
    if (userId && !isNaN(userId)) {
      userVotes = await getUserVotingStatus(userId);
    }

    // Add hasVoted flag to each movie
    const moviesWithVotes = movies.map(movie => ({
      ...movie,
      hasVoted: userVotes[movie.id] || false,
    }));

    res.json(moviesWithVotes);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    res.status(500).json({ 
      error: "Failed to fetch trending movies",
      message: error.message 
    });
  }
});

// POST /api/trending-movies/vote - Submit a vote for a trending movie
app.post("/api/trending-movies/vote", async (req, res) => {
  try {
    const { movieId, userId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "Missing required field: movieId" });
    }

    const userIdNum = userId ? parseInt(userId, 10) : null;
    const result = await submitTrendingVote(parseInt(movieId, 10), userIdNum);

    res.json(result);
  } catch (error) {
    console.error("Error submitting trending vote:", error);
    res.status(500).json({ 
      error: "Failed to submit vote",
      message: error.message 
    });
  }
});

// POST /api/trending-movies/add - Add a new movie to trending list
app.post("/api/trending-movies/add", async (req, res) => {
  try {
    const { movieId, title, posterUrl, userId } = req.body;

    if (!title && !movieId) {
      return res.status(400).json({ error: "Either movieId or title is required" });
    }

    const userIdNum = userId ? parseInt(userId, 10) : null;
    const movieIdNum = movieId ? parseInt(movieId, 10) : null;
    
    const newMovie = await addTrendingMovie(movieIdNum, title, posterUrl, userIdNum);

    res.json({
      success: true,
      movie: newMovie,
    });
  } catch (error) {
    console.error("Error adding trending movie:", error);
    res.status(500).json({ 
      error: "Failed to add movie to trending list",
      message: error.message 
    });
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
  console.log(`🎯 Quiz endpoints ready: /api/movies/:id/quiz`);
  console.log(`⚔️  Battle endpoints ready: /api/movie-battle/current, /api/movie-battle/vote, /api/movie-battle/leaderboard`);
  console.log(`🎯 Quiz endpoints ready: /api/movies/:id/quiz, /api/movies/:id/quiz/submit`);
  console.log(`🔥 Trending endpoints ready: /api/trending-movies, /api/trending-movies/vote, /api/trending-movies/add`);
  console.log(`☁️  Cloudinary upload endpoints ready: /api/upload, /api/upload/multiple, /api/upload/:publicId, /api/upload/test`);
  console.log(`👑 Admin endpoints ready: /api/admin/* (requires admin authentication)`);
  
  // Start the scheduler for automatic daily updates
  startScheduler();
});
