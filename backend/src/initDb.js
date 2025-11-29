require("dotenv").config();
const { query } = require("./db");

/**
 * Initialize the database schema and seed initial data
 * Run this once to set up tables and populate with hardcoded data
 */
async function initDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Create movies table
    await query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        genre VARCHAR(100) NOT NULL,
        description TEXT,
        duration INTEGER,
        poster_url VARCHAR(500),
        trailer_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Movies table created/verified");

    // Add new columns if they don't exist (for existing databases)
    try {
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS description TEXT`);
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS duration INTEGER`);
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500)`);
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url VARCHAR(500)`);
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating DECIMAL(3,1)`);
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log("✅ Movie table columns updated");
    } catch (error) {
      // Columns might already exist, that's okay
      console.log("ℹ️  Movie table columns check completed");
    }

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        profile_picture_url VARCHAR(500),
        theme_preference VARCHAR(50) DEFAULT 'dark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created/verified");

    // Add new columns if they don't exist (for existing databases)
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500)`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(50) DEFAULT 'dark'`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log("✅ User table columns updated");
    } catch (error) {
      // Columns might already exist, that's okay
      console.log("ℹ️  User table columns check completed");
    }

    // Create favourites table (links users to their favorite movies)
    await query(`
      CREATE TABLE IF NOT EXISTS favourites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `);
    console.log("✅ Favourites table created/verified");

    // Create watchlist table (links users to movies they want to watch)
    await query(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `);
    console.log("✅ Watchlist table created/verified");

    // Create ratings table (users rate movies 1-5 stars)
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `);
    console.log("✅ Ratings table created/verified");

    // Create comments table (users leave written reviews/comments)
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Comments table created/verified");

    // Check if movies already exist
    const movieCount = await query("SELECT COUNT(*) FROM movies");
    if (movieCount.rows[0].count === "0") {
      // Insert hardcoded movies
      const movies = [
        { title: "The Grand Heist", year: 2018, genre: "Action" },
        { title: "Midnight Lullaby", year: 2020, genre: "Drama" },
        { title: "Comet Trail", year: 2015, genre: "Sci-Fi" },
        { title: "Ocean Whisper", year: 2019, genre: "Romance" },
        { title: "Hidden Frames", year: 2022, genre: "Thriller" },
        { title: "Neon Alley", year: 2017, genre: "Crime" },
      ];

      for (const movie of movies) {
        await query(
          "INSERT INTO movies (title, year, genre) VALUES ($1, $2, $3)",
          [movie.title, movie.year, movie.genre]
        );
      }
      console.log(`✅ Inserted ${movies.length} movies`);
    } else {
      console.log("ℹ️  Movies already exist, skipping seed");
    }

    // Check if users already exist
    const userCount = await query("SELECT COUNT(*) FROM users");
    if (userCount.rows[0].count === "0") {
      // Insert hardcoded user (password stored as plain text for now - we'll hash later if needed)
      await query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        ["moviebuff", "popcorn123"]
      );
      console.log("✅ Inserted demo user (moviebuff / popcorn123)");
    } else {
      console.log("ℹ️  Users already exist, skipping seed");
    }

    console.log("🎉 Database initialization complete!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      process.exit(1);
    });
}

module.exports = { initDatabase };

