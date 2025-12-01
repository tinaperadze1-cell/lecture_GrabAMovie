/**
 * Create .env file in backend/ directory with TMDB_API_KEY
 * This ensures the file exists in the correct location
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

console.log("🔧 Creating backend/.env file...\n");

// Check if .env already exists
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const hasKey = content.match(/TMDB_API_KEY\s*=\s*([^\r\n]+)/);
  
  if (hasKey && hasKey[1] && hasKey[1] !== "MY_KEY_HERE" && hasKey[1].trim() !== "") {
    console.log("✅ .env file exists and has TMDB_API_KEY configured");
    console.log(`   Key: ${hasKey[1].substring(0, 8)}...${hasKey[1].substring(hasKey[1].length - 4)}`);
    process.exit(0);
  } else {
    console.log("⚠️  .env exists but TMDB_API_KEY needs to be set");
  }
}

// Default content - preserve DATABASE_URL if it exists
let databaseUrl = process.env.DATABASE_URL || "your_database_url_here";
if (fs.existsSync(envPath)) {
  const existing = fs.readFileSync(envPath, "utf8");
  const dbMatch = existing.match(/DATABASE_URL\s*=\s*([^\r\n]+)/);
  if (dbMatch && dbMatch[1] && dbMatch[1] !== "your_database_url_here") {
    databaseUrl = dbMatch[1];
  }
}

const envContent = `# Database Configuration
DATABASE_URL=${databaseUrl}

# TMDB API Key
# Replace my_real_key with your actual TMDB API key from https://www.themoviedb.org/settings/api
TMDB_API_KEY=my_real_key

# IMDB API Key (Optional)
OMDB_API_KEY=${process.env.OMDB_API_KEY || "ca478e54"}
`;

fs.writeFileSync(envPath, envContent);

console.log("✅ Created backend/.env file");
console.log("📝 Location: " + envPath);
console.log("\n⚠️  IMPORTANT: Replace 'my_real_key' with your actual TMDB API key!");
console.log("   1. Get your key from: https://www.themoviedb.org/settings/api");
console.log("   2. Open backend/.env");
console.log("   3. Change: TMDB_API_KEY=my_real_key");
console.log("   4. To: TMDB_API_KEY=your_actual_key_here");
console.log("   5. Or run: node add-tmdb-key.js YOUR_ACTUAL_KEY");

