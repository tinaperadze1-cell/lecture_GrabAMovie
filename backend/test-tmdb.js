/**
 * Test script to verify TMDB API key is configured correctly
 * Run: node test-tmdb.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const axios = require("axios");

console.log("🔍 Testing TMDB API Configuration...\n");

// Check if API key exists
if (!TMDB_API_KEY) {
  console.log("❌ ERROR: TMDB_API_KEY is not set in .env file!");
  console.log("\n📝 To fix this:");
  console.log("   1. Open backend/.env file");
  console.log("   2. Add this line: TMDB_API_KEY=your_api_key_here");
  console.log("   3. Get your free API key from: https://www.themoviedb.org/settings/api");
  console.log("   4. Save the file and restart your backend server");
  process.exit(1);
}

if (TMDB_API_KEY.trim() === "" || TMDB_API_KEY === "your_api_key_here") {
  console.log("❌ ERROR: TMDB_API_KEY is empty or still has placeholder value!");
  console.log("\n📝 Please replace 'your_api_key_here' with your actual API key");
  process.exit(1);
}

console.log("✅ TMDB_API_KEY found in environment");
console.log(`   Key length: ${TMDB_API_KEY.length} characters`);
console.log(`   Key preview: ${TMDB_API_KEY.substring(0, 8)}...${TMDB_API_KEY.substring(TMDB_API_KEY.length - 4)}`);
console.log("\n🔄 Testing TMDB API connection...\n");

// Test the API
async function testTMDB() {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US",
        page: 1,
        region: "US",
      },
      timeout: 10000,
    });

    if (response.data && response.data.results) {
      console.log("✅ SUCCESS! TMDB API is working!");
      console.log(`   Found ${response.data.results.length} movies`);
      console.log("\n📽️  Sample movies:");
      response.data.results.slice(0, 5).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (${movie.release_date || "N/A"})`);
      });
      console.log("\n🎉 Your TMDB API key is configured correctly!");
      console.log("   Restart your backend server if you just added the key.");
    } else {
      console.log("⚠️  WARNING: API responded but no movies found");
    }
  } catch (error) {
    if (error.response) {
      // API responded with error
      if (error.response.status === 401) {
        console.log("❌ ERROR: Invalid API key!");
        console.log("   The API key you provided is not valid.");
        console.log("   Please check your API key at: https://www.themoviedb.org/settings/api");
      } else if (error.response.status === 404) {
        console.log("❌ ERROR: API endpoint not found");
      } else {
        console.log(`❌ ERROR: API returned status ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.status_message || error.message}`);
      }
    } else if (error.request) {
      console.log("❌ ERROR: Could not reach TMDB API");
      console.log("   Check your internet connection");
    } else {
      console.log(`❌ ERROR: ${error.message}`);
    }
    process.exit(1);
  }
}

testTMDB();

