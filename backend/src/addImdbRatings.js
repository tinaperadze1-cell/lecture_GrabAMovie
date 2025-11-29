require("dotenv").config();
const { query } = require("./db");

/**
 * Add IMDB ratings to movies in the database
 * Based on actual IMDB ratings as of 2024
 */
const imdbRatings = {
  "The Shawshank Redemption": 9.3,
  "The Godfather": 9.2,
  "The Dark Knight": 9.0,
  "The Godfather Part II": 9.0,
  "12 Angry Men": 9.0,
  "Schindler's List": 9.0,
  "The Lord of the Rings: The Return of the King": 9.0,
  "Pulp Fiction": 8.9,
  "The Lord of the Rings: The Fellowship of the Ring": 8.9,
  "The Good, the Bad and the Ugly": 8.8,
  "Forrest Gump": 8.8,
  "Fight Club": 8.8,
  "The Lord of the Rings: The Two Towers": 8.8,
  "Inception": 8.8,
  "Star Wars: Episode IV - A New Hope": 8.6,
  "The Matrix": 8.7,
  "Goodfellas": 8.7,
  "The Empire Strikes Back": 8.7,
  "The Prestige": 8.5,
  "Casablanca": 8.5,
  "The Lion King": 8.5,
  "Gladiator": 8.5,
  "Titanic": 7.9,
  "The Departed": 8.5,
  "The Green Mile": 8.6,
  "Saving Private Ryan": 8.6,
  "The Usual Suspects": 8.5,
  "Se7en": 8.6,
  "Braveheart": 8.3,
  "The Shining": 8.4,
  "The Pianist": 8.5,
  "Whiplash": 8.5,
  "Parasite": 8.5,
  "Get Out": 7.7,
  "Spirited Away": 8.6,
  "The Social Network": 7.7,
  "Citizen Kane": 8.3,
  "Gone with the Wind": 8.1,
  "Lawrence of Arabia": 8.3,
  "The Wizard of Oz": 8.0,
  "The Graduate": 8.0,
  "On the Waterfront": 8.1,
  "Singin' in the Rain": 8.3,
  "Psycho": 8.5,
  "Jaws": 8.0,
  "The Exorcist": 8.1,
  "North by Northwest": 8.3,
  "The Silence of the Lambs": 8.6,
  "Alien": 8.5,
  "The French Connection": 7.7,
  "Raiders of the Lost Ark": 8.4,
  "Back to the Future": 8.5,
  "Eternal Sunshine of the Spotless Mind": 8.3,
  "No Country for Old Men": 8.2,
  "Moonlight": 7.4,
  "There Will Be Blood": 8.2,
  "In the Mood for Love": 7.6,
  "Mulholland Drive": 7.9,
  "The Intouchables": 8.5,
  "Rosemary's Baby": 8.0,
  "The Birds": 7.7,
  "Apocalypse Now": 8.4,
  "Blade Runner": 8.1,
  "Taxi Driver": 8.2,
  "Raging Bull": 8.2,
  "The Deer Hunter": 8.1,
  "One Flew Over the Cuckoo's Nest": 8.7,
  "Chinatown": 8.2,
  "The Conversation": 7.8,
  "Network": 8.1,
  "Rocky": 8.1,
  "Annie Hall": 8.0,
  "The Sting": 8.3,
  "Butch Cassidy and the Sundance Kid": 8.0,
  "Midnight Cowboy": 7.8,
  "Easy Rider": 7.3,
  "The Wild Bunch": 7.8,
  "2001: A Space Odyssey": 8.3,
  "Planet of the Apes": 8.0,
  "The Sound of Music": 8.0,
  "Dr. Strangelove": 8.4,
  "To Kill a Mockingbird": 8.3,
  "West Side Story": 7.5,
  "Some Like It Hot": 8.2,
  "Vertigo": 8.3,
  "Rear Window": 8.5,
  "Sunset Boulevard": 8.4,
  "All About Eve": 8.2,
  "The Third Man": 8.1,
  "It's a Wonderful Life": 8.6,
  "Double Indemnity": 8.3,
  "The Maltese Falcon": 8.0,
  "Modern Times": 8.5,
  "City Lights": 8.5,
  "The General": 8.1,
  "The Kid": 8.2,
  "Interstellar": 8.6,
  "Mad Max: Fury Road": 8.1,
  "Django Unchained": 8.4,
  "The Revenant": 8.0,
  "Birdman": 7.7,
  "12 Years a Slave": 8.1,
  "Gravity": 7.7,
  "Her": 8.0,
  "The Grand Budapest Hotel": 8.1,
  "La La Land": 8.0,
  "Arrival": 7.9,
  "Blade Runner 2049": 8.0,
  "Dunkirk": 7.8,
  "Three Billboards Outside Ebbing, Missouri": 8.1,
  "Call Me by Your Name": 7.8,
  "The Shape of Water": 7.3,
  "Black Panther": 7.3,
  "A Star Is Born": 7.6,
  "Bohemian Rhapsody": 7.9,
  "Roma": 7.7,
  "Joker": 8.2,
  "1917": 8.2,
  "Once Upon a Time in Hollywood": 7.6,
  "The Irishman": 7.8,
  "Nomadland": 7.3,
  "Dune": 8.0,
  "The Power of the Dog": 6.8,
  "Everything Everywhere All at Once": 7.8,
  "Top Gun: Maverick": 8.2,
  "The Banshees of Inisherin": 7.7,
  "Oppenheimer": 8.3,
  "Barbie": 6.5,
  "Killers of the Flower Moon": 7.6,
  "Poor Things": 7.8,
  "The Zone of Interest": 7.5,
};

async function addImdbRatings() {
  try {
    console.log("🔄 Adding IMDB ratings to movies...");

    // Add imdb_rating column if it doesn't exist
    try {
      await query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating DECIMAL(3,1)`);
      console.log("✅ IMDB rating column added/verified");
    } catch (error) {
      console.log("ℹ️  IMDB rating column check completed");
    }

    // Get all movies
    const movies = await query("SELECT id, title FROM movies");

    let updated = 0;
    for (const movie of movies.rows) {
      const rating = imdbRatings[movie.title];
      if (rating) {
        await query(
          "UPDATE movies SET imdb_rating = $1 WHERE id = $2",
          [rating, movie.id]
        );
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} movies with IMDB ratings!`);
  } catch (error) {
    console.error("❌ Error adding IMDB ratings:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addImdbRatings()
    .then(() => {
      console.log("✅ IMDB ratings update complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ IMDB ratings update failed:", error);
      process.exit(1);
    });
}

module.exports = { addImdbRatings };

