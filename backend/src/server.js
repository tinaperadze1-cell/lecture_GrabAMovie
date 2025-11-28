const express = require("express");
const cors = require("cors");
const { query } = require("./db");

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
    const result = await query(
      "SELECT id, title, year, genre FROM movies ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(
    `📊 Database endpoints ready: /api/movies, /api/login, /api/signup, /api/favourites, /api/watchlist`
  );
});
