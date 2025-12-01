/**
 * Direct test of TMDB API with current .env configuration
 * This verifies the API key is working
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const axios = require("axios");

console.log("🧪 Testing TMDB API Configuration\n");
console.log("=" .repeat(50));

// Check .env file location
const envPath = path.resolve(__dirname, ".env");
console.log(`📁 .env file location: ${envPath}`);
console.log(`   Exists: ${require("fs").existsSync(envPath) ? "✅ Yes" : "❌ No"}\n`);

// Check environment variable
const apiKey = process.env.TMDB_API_KEY;
console.log("🔑 TMDB_API_KEY from environment:");
if (!apiKey) {
  console.log("   ❌ NOT SET");
  console.log("\n💡 Fix: Add TMDB_API_KEY=your_key to backend/.env");
  process.exit(1);
} else if (apiKey === "MY_KEY_HERE" || apiKey === "my_real_key" || apiKey.trim() === "") {
  console.log(`   ⚠️  Set to placeholder: "${apiKey}"`);
  console.log("\n💡 Fix: Replace placeholder with your actual API key in backend/.env");
  process.exit(1);
} else {
  console.log(`   ✅ Found (length: ${apiKey.length})`);
  console.log(`   Preview: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);
}

// Test API call
console.log("🌐 Testing TMDB API connection...\n");

async function testAPI() {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
      params: {
        api_key: apiKey,
        language: "en-US",
        page: 1,
        region: "US",
      },
      timeout: 10000,
    });

    if (response.data && response.data.results) {
      console.log("=" .repeat(50));
      console.log("✅ SUCCESS! TMDB API is working correctly!\n");
      console.log(`📽️  Found ${response.data.results.length} movies\n`);
      console.log("🎬 Sample movies:");
      response.data.results.slice(0, 5).forEach((movie, i) => {
        console.log(`   ${i + 1}. ${movie.title} (${movie.release_date || "N/A"})`);
      });
      console.log("\n" + "=" .repeat(50));
      console.log("🎉 Your TMDB integration is fully configured!");
      console.log("   Restart your backend server to apply changes.");
      return true;
    } else {
      console.log("⚠️  API responded but no movies found");
      return false;
    }
  } catch (error) {
    console.log("=" .repeat(50));
    if (error.response) {
      if (error.response.status === 401) {
        console.log("❌ ERROR: Invalid API Key!");
        console.log("   The API key you provided is not valid.");
        console.log("   Please check your key at: https://www.themoviedb.org/settings/api");
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
    console.log("\n" + "=" .repeat(50));
    return false;
  }
}

testAPI().then(success => {
  process.exit(success ? 0 : 1);
});

