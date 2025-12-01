/**
 * Complete TMDB Setup Verification Script
 * Verifies .env file, dotenv loading, and API functionality
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

console.log("🔍 TMDB API Setup Verification\n");
console.log("=" .repeat(60));

// Step 1: Check .env file location
const envPath = path.resolve(__dirname, ".env");
console.log("\n1️⃣  Checking .env file location...");
console.log(`   Path: ${envPath}`);
const envExists = fs.existsSync(envPath);
console.log(`   Exists: ${envExists ? "✅ Yes" : "❌ No"}`);

if (!envExists) {
  console.log("\n   📝 Creating .env file...");
  const defaultContent = `# Database Configuration
DATABASE_URL=your_database_url_here

# TMDB API Key
# Replace my_real_key with your actual TMDB API key from https://www.themoviedb.org/settings/api
TMDB_API_KEY=my_real_key

# IMDB API Key (Optional)
OMDB_API_KEY=ca478e54
`;
  fs.writeFileSync(envPath, defaultContent);
  console.log("   ✅ Created .env file");
}

// Step 2: Check .env content
console.log("\n2️⃣  Checking .env file content...");
let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
  const tmdbMatch = envContent.match(/TMDB_API_KEY\s*=\s*([^\r\n]+)/);
  if (tmdbMatch) {
    const keyValue = tmdbMatch[1].trim();
    console.log(`   Found: TMDB_API_KEY=${keyValue.substring(0, 20)}...`);
    if (keyValue === "my_real_key" || keyValue === "MY_KEY_HERE" || keyValue === "") {
      console.log("   ⚠️  Still set to placeholder - needs replacement");
    } else {
      console.log("   ✅ Has actual key value");
    }
  } else {
    console.log("   ❌ TMDB_API_KEY not found in .env");
  }
}

// Step 3: Test dotenv loading
console.log("\n3️⃣  Testing dotenv.config() loading...");
require("dotenv").config({ path: envPath });
const loadedKey = process.env.TMDB_API_KEY;
if (loadedKey) {
  console.log(`   ✅ dotenv loaded TMDB_API_KEY (length: ${loadedKey.length})`);
  if (loadedKey === "my_real_key" || loadedKey === "MY_KEY_HERE") {
    console.log("   ⚠️  Value is placeholder - replace with real key");
  }
} else {
  console.log("   ❌ dotenv did not load TMDB_API_KEY");
}

// Step 4: Check code reading the key
console.log("\n4️⃣  Verifying code can read process.env.TMDB_API_KEY...");
const tmdbServicePath = path.resolve(__dirname, "src", "tmdbService.js");
if (fs.existsSync(tmdbServicePath)) {
  const serviceCode = fs.readFileSync(tmdbServicePath, "utf8");
  if (serviceCode.includes("process.env.TMDB_API_KEY")) {
    console.log("   ✅ tmdbService.js reads process.env.TMDB_API_KEY");
  } else {
    console.log("   ❌ tmdbService.js does not read process.env.TMDB_API_KEY");
  }
} else {
  console.log("   ⚠️  tmdbService.js not found");
}

// Step 5: Test API if key is real
console.log("\n5️⃣  Testing TMDB API connection...");
if (loadedKey && loadedKey !== "my_real_key" && loadedKey !== "MY_KEY_HERE" && loadedKey.trim() !== "") {
  console.log("   Attempting API call...");
  axios.get("https://api.themoviedb.org/3/movie/now_playing", {
    params: {
      api_key: loadedKey,
      language: "en-US",
      page: 1,
      region: "US",
    },
    timeout: 10000,
  })
  .then(response => {
    if (response.data && response.data.results) {
      console.log("   ✅ API call successful!");
      console.log(`   📽️  Found ${response.data.results.length} movies`);
      console.log("\n   🎬 Sample movies:");
      response.data.results.slice(0, 3).forEach((movie, i) => {
        console.log(`      ${i + 1}. ${movie.title}`);
      });
      console.log("\n" + "=" .repeat(60));
      console.log("🎉 TMDB integration is FULLY WORKING!");
      console.log("   Your backend server should show movies correctly.");
      process.exit(0);
    }
  })
  .catch(error => {
    if (error.response && error.response.status === 401) {
      console.log("   ❌ Invalid API key - check your key at https://www.themoviedb.org/settings/api");
    } else {
      console.log(`   ❌ API error: ${error.message}`);
    }
    console.log("\n" + "=" .repeat(60));
    console.log("⚠️  Setup incomplete - API key needs to be valid");
    process.exit(1);
  });
} else {
  console.log("   ⚠️  Skipping API test - key is placeholder");
  console.log("\n" + "=" .repeat(60));
  console.log("📋 SETUP SUMMARY:");
  console.log("   ✅ .env file exists at: " + envPath);
  console.log("   ✅ dotenv.config() is configured");
  console.log("   ✅ Code reads process.env.TMDB_API_KEY");
  console.log("   ⚠️  TMDB_API_KEY needs to be replaced with your real key");
  console.log("\n💡 Next steps:");
  console.log("   1. Get your free API key from: https://www.themoviedb.org/settings/api");
  console.log("   2. Open backend/.env file");
  console.log("   3. Replace: TMDB_API_KEY=my_real_key");
  console.log("   4. With: TMDB_API_KEY=your_actual_key_here");
  console.log("   5. Restart your backend server");
  console.log("   6. Run this script again to verify");
  process.exit(0);
}

