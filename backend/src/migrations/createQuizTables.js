const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Create all tables needed for the Movie Quiz system
 */
async function createQuizTables() {
  try {
    console.log("🔄 Creating Movie Quiz system tables...");

    // Create movie_quizzes table (stores quiz questions for each movie)
    await query(`
      CREATE TABLE IF NOT EXISTS movie_quizzes (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        questions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(movie_id)
      )
    `);
    console.log("✅ movie_quizzes table created");

    // Create quiz_results table (stores user quiz results)
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answers JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ quiz_results table created");

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_movie ON movie_quizzes(movie_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_results_user ON quiz_results(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_results_movie ON quiz_results(movie_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_results_timestamp ON quiz_results(timestamp);
    `);
    console.log("✅ Indexes created for quiz tables");

    console.log("✅ Movie Quiz tables created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating Movie Quiz tables:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createQuizTables()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createQuizTables };

