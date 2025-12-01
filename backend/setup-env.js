/**
 * Automated .env file setup for TMDB integration
 * This script creates/updates the .env file with TMDB_API_KEY placeholder
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

console.log("🔧 Setting up backend/.env file for TMDB integration...\n");

// Default .env content
const defaultEnvContent = `# Database Configuration
DATABASE_URL=${process.env.DATABASE_URL || "your_database_url_here"}

# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)
# Replace MY_KEY_HERE with your actual API key
TMDB_API_KEY=MY_KEY_HERE

# IMDB API Key (Optional)
OMDB_API_KEY=${process.env.OMDB_API_KEY || "ca478e54"}
`;

let envContent = defaultEnvContent;

// If .env exists, read it and update only TMDB_API_KEY
if (fs.existsSync(envPath)) {
  console.log("📝 Found existing .env file, updating it...");
  const existingContent = fs.readFileSync(envPath, "utf8");
  
  // Check if TMDB_API_KEY exists
  if (existingContent.includes("TMDB_API_KEY")) {
    // Update existing TMDB_API_KEY line
    const lines = existingContent.split("\n");
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith("TMDB_API_KEY") && !line.includes("MY_KEY_HERE")) {
        // Keep existing key if it's not the placeholder
        return line;
      } else if (line.trim().startsWith("TMDB_API_KEY")) {
        // Replace placeholder with placeholder (in case user wants to update)
        return "TMDB_API_KEY=MY_KEY_HERE";
      }
      return line;
    });
    envContent = updatedLines.join("\n");
    
    // If TMDB_API_KEY wasn't found, add it
    if (!envContent.includes("TMDB_API_KEY")) {
      envContent += "\n# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)\nTMDB_API_KEY=MY_KEY_HERE\n";
    }
  } else {
    // Add TMDB_API_KEY to existing file
    envContent = existingContent;
    if (!envContent.endsWith("\n")) {
      envContent += "\n";
    }
    envContent += "\n# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)\nTMDB_API_KEY=MY_KEY_HERE\n";
  }
} else {
  console.log("📝 Creating new .env file...");
}

// Write the .env file
fs.writeFileSync(envPath, envContent);

console.log("✅ .env file created/updated!");
console.log("\n📋 Next steps:");
console.log("   1. Get your free TMDB API key from: https://www.themoviedb.org/settings/api");
console.log("   2. Open backend/.env file");
console.log("   3. Replace MY_KEY_HERE with your actual API key");
console.log("   4. Or run: node add-tmdb-key.js YOUR_ACTUAL_KEY");
console.log("   5. Restart your backend server");
console.log("\n💡 The backend is already configured to read TMDB_API_KEY from .env");

