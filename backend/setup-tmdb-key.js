/**
 * Helper script to check and guide TMDB API key setup
 * Run: node setup-tmdb-key.js
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

console.log("🔍 Checking TMDB API Key setup...\n");

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log("❌ .env file not found!");
  console.log("\n📝 Creating .env file...");
  
  // Create .env file with template
  const envTemplate = `# Database Configuration
DATABASE_URL=your_database_url_here

# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)
TMDB_API_KEY=

# IMDB API Key (Optional)
OMDB_API_KEY=ca478e54
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log("✅ Created .env file!");
  console.log("\n⚠️  Please add your TMDB_API_KEY to backend/.env");
  console.log("   Get your free API key from: https://www.themoviedb.org/settings/api");
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, "utf8");

// Check if TMDB_API_KEY exists
if (!envContent.includes("TMDB_API_KEY")) {
  console.log("❌ TMDB_API_KEY not found in .env file!");
  console.log("\n📝 Adding TMDB_API_KEY to .env file...");
  
  // Add TMDB_API_KEY to .env
  const updatedContent = envContent + "\n# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)\nTMDB_API_KEY=\n";
  fs.writeFileSync(envPath, updatedContent);
  console.log("✅ Added TMDB_API_KEY placeholder to .env file!");
  console.log("\n⚠️  Please add your actual API key value after the = sign");
  console.log("   Get your free API key from: https://www.themoviedb.org/settings/api");
  process.exit(1);
}

// Check if TMDB_API_KEY has a value
const tmdbKeyMatch = envContent.match(/TMDB_API_KEY\s*=\s*(.+)/);
if (!tmdbKeyMatch || !tmdbKeyMatch[1] || tmdbKeyMatch[1].trim() === "") {
  console.log("❌ TMDB_API_KEY is empty in .env file!");
  console.log("\n📋 To fix this:");
  console.log("   1. Get your free API key from: https://www.themoviedb.org/settings/api");
  console.log("   2. Open backend/.env file");
  console.log("   3. Find the line: TMDB_API_KEY=");
  console.log("   4. Add your key after the = sign: TMDB_API_KEY=your_key_here");
  console.log("   5. Save the file and restart your backend server");
  process.exit(1);
}

const apiKey = tmdbKeyMatch[1].trim();
if (apiKey.length < 20) {
  console.log("⚠️  Warning: TMDB_API_KEY seems too short. Make sure it's correct!");
}

console.log("✅ TMDB_API_KEY is configured!");
console.log(`   Key length: ${apiKey.length} characters`);
console.log(`   Key preview: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
console.log("\n🎉 Setup looks good! Restart your backend server if you just added the key.");
console.log("\n📖 For detailed setup instructions, see: backend/TMDB_SETUP.md");

