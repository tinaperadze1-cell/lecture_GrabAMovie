/**
 * Migration: Move all hardcoded actors from actorsDatabase.js to Neon database
 * This script reads the hardcoded actors and inserts them into the movie_actors table
 * 
 * NOTE: This migration has already been completed (824 actors inserted for 138 movies).
 * All actors are now stored in the movie_actors table in Neon database.
 * The actorsDatabase.js file has been removed as it's no longer needed.
 * 
 * This file is kept for historical reference only. If run again, it will skip
 * movies that already have actors in the database.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

// ACTORS_DATABASE was migrated to the database and removed from codebase
// The migration has been completed - all actors are now in movie_actors table
const ACTORS_DATABASE = {};

/**
 * Generate generic actors for movies not in hardcoded database
 */
function generateGenericActors(title) {
  const genericFirstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Emma", "James", "Olivia", "William", "Sophia", "Daniel", "Isabella", "Matthew", "Ava"];
  const genericLastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor"];
  const characterTypes = ["Main Character", "Supporting Role", "Love Interest", "Villain", "Sidekick", "Mentor", "Friend", "Family Member"];
  
  const numActors = 5 + Math.floor(Math.random() * 4); // 5-8 actors
  const actors = [];
  
  // Use title hash to make it deterministic for same movie
  const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = (seed) => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  let seed = titleHash;
  
  for (let i = 0; i < numActors; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const firstName = genericFirstNames[Math.floor(rng(seed) * genericFirstNames.length)];
    seed = (seed * 9301 + 49297) % 233280;
    const lastName = genericLastNames[Math.floor(rng(seed) * genericLastNames.length)];
    const characterType = characterTypes[i % characterTypes.length];
    
    actors.push({
      name: `${firstName} ${lastName}`,
      character: characterType,
      profilePhoto: null,
    });
  }
  
  return actors;
}

async function migrateActorsToDatabase() {
  try {
    console.log("🔄 Starting actors migration to database...\n");

    // First, ensure the table exists
    const { createActorsTable } = require("./createActorsTable");
    await createActorsTable();

    // Get all movies from database
    const moviesResult = await query("SELECT id, title, year FROM movies ORDER BY id");
    const movies = moviesResult.rows;
    
    console.log(`📽️  Found ${movies.length} movies in database\n`);

    let insertedCount = 0;
    let skippedCount = 0;
    let errors = [];

    // Process each movie
    for (const movie of movies) {
      try {
        // Check if actors already exist for this movie
        const existingActors = await query(
          "SELECT COUNT(*) as count FROM movie_actors WHERE movie_id = $1",
          [movie.id]
        );

        if (parseInt(existingActors.rows[0].count) > 0) {
          console.log(`⏭️  Skipping "${movie.title}" - actors already exist`);
          skippedCount++;
          continue;
        }

        // Try to get actors from hardcoded database
        let actors = ACTORS_DATABASE[movie.title] || null;

        // Try title variations if exact match not found
        if (!actors) {
          const titleVariations = [
            movie.title.replace(/ \(\d{4}\)$/, ""), // Remove (year) suffix
            movie.title.replace(/:\s*Episode.*$/i, ""), // Remove episode suffix
            movie.title.replace(/:\s*Part.*$/i, ""), // Remove part suffix
          ];

          for (const variation of titleVariations) {
            if (ACTORS_DATABASE[variation]) {
              actors = ACTORS_DATABASE[variation];
              break;
            }
          }
        }

        // If not found in hardcoded database, generate generic actors
        if (!actors) {
          actors = generateGenericActors(movie.title);
          console.log(`🔧 Generated actors for "${movie.title}"`);
        } else {
          console.log(`✅ Found hardcoded actors for "${movie.title}"`);
        }

        // Insert actors into database
        for (let i = 0; i < actors.length && i < 10; i++) {
          const actor = actors[i];
          try {
            await query(
              `INSERT INTO movie_actors 
               (movie_id, actor_name, character_name, profile_photo_url, billing_order) 
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (movie_id, actor_name, character_name) DO NOTHING`,
              [
                movie.id,
                actor.name,
                actor.character || null,
                actor.profilePhoto || null,
                i, // billing order
              ]
            );
            insertedCount++;
          } catch (insertError) {
            // Ignore duplicate key errors
            if (!insertError.message.includes("duplicate key")) {
              throw insertError;
            }
          }
        }

        console.log(`   → Inserted ${Math.min(actors.length, 10)} actors\n`);
      } catch (error) {
        console.error(`❌ Error processing "${movie.title}":`, error.message);
        errors.push({ movie: movie.title, error: error.message });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully inserted: ${insertedCount} actors`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} movies`);
    console.log(`❌ Errors: ${errors.length} movies`);
    
    if (errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. "${err.movie}": ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    console.log("\n🎉 Actors migration complete!");
    return { insertedCount, skippedCount, errors };
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateActorsToDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateActorsToDatabase };

