/**
 * Script to get all movies and create comprehensive actors database
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { query } = require("./db");
const fs = require("fs");

async function getAllMovies() {
  try {
    const result = await query("SELECT id, title, year FROM movies ORDER BY id");
    return result.rows;
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

async function createActorsDatabase() {
  const movies = await getAllMovies();
  console.log(`Found ${movies.length} movies`);
  
  // This will be used to create the comprehensive database
  console.log("\nMovies that need actors:");
  movies.forEach((movie, index) => {
    console.log(`${index + 1}. "${movie.title}" (${movie.year})`);
  });
}

if (require.main === module) {
  createActorsDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { getAllMovies };

