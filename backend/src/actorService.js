const { query } = require("./db");

/**
 * Actor Service
 * Fetches actors from Neon database
 */

/**
 * Get movie cast/actors from database
 * @param {number} movieId - Movie ID
 * @returns {Promise<Array>} Array of actor objects with name, character, profile photo
 */
async function fetchMovieActors(movieId) {
  try {
    // Fetch actors from database
    const result = await query(
      `SELECT 
        actor_name as name,
        character_name as character,
        profile_photo_url as profilePhoto,
        billing_order as "order"
      FROM movie_actors
      WHERE movie_id = $1
      ORDER BY billing_order ASC, id ASC
      LIMIT 10`,
      [movieId]
    );

    return result.rows.map((actor) => ({
      name: actor.name,
      character: actor.character || null,
      profilePhoto: actor.profilePhoto || null,
      order: actor.order || 0,
    }));
  } catch (error) {
    console.error(`Error fetching actors for movie ID ${movieId}:`, error.message);
    return [];
  }
}

module.exports = {
  fetchMovieActors,
};

