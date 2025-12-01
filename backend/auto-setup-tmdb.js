/**
 * Automatic TMDB setup - Creates .env file with placeholder
 * Run this first, then use add-tmdb-key.js with your actual key
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

console.log("🔧 Automatic TMDB Setup\n");

// Check if .env exists
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  
  if (content.includes("TMDB_API_KEY")) {
    const hasRealKey = content.match(/TMDB_API_KEY\s*=\s*([^\s\r\n]+)/);
    if (hasRealKey && hasRealKey[1] !== "MY_KEY_HERE" && hasRealKey[1].trim() !== "") {
      console.log("✅ TMDB_API_KEY already configured in .env");
      console.log(`   Key: ${hasRealKey[1].substring(0, 8)}...${hasRealKey[1].substring(hasRealKey[1].length - 4)}`);
      console.log("\n💡 If you want to update it, run:");
      console.log("   node add-tmdb-key.js YOUR_NEW_KEY");
      process.exit(0);
    } else {
      console.log("⚠️  TMDB_API_KEY found but set to placeholder (MY_KEY_HERE)");
      console.log("   Run: node add-tmdb-key.js YOUR_ACTUAL_KEY");
      process.exit(0);
    }
  } else {
    // Add TMDB_API_KEY to existing .env
    console.log("📝 Adding TMDB_API_KEY to existing .env file...");
    let newContent = content;
    if (!newContent.endsWith("\n")) {
      newContent += "\n";
    }
    newContent += "\n# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)\n";
    newContent += "# Replace MY_KEY_HERE with your actual API key\n";
    newContent += "TMDB_API_KEY=MY_KEY_HERE\n";
    fs.writeFileSync(envPath, newContent);
    console.log("✅ Added TMDB_API_KEY placeholder to .env");
  }
} else {
  // Create new .env file
  console.log("📝 Creating new .env file...");
  const defaultContent = `# Database Configuration
DATABASE_URL=${process.env.DATABASE_URL || "your_database_url_here"}

# TMDB API Key (Get it from https://www.themoviedb.org/settings/api)
# Replace MY_KEY_HERE with your actual API key
TMDB_API_KEY=MY_KEY_HERE

# IMDB API Key (Optional)
OMDB_API_KEY=${process.env.OMDB_API_KEY || "ca478e54"}
`;
  fs.writeFileSync(envPath, defaultContent);
  console.log("✅ Created .env file with TMDB_API_KEY placeholder");
}

console.log("\n📋 Next steps:");
console.log("   1. Get your free API key from: https://www.themoviedb.org/settings/api");
console.log("   2. Run: node add-tmdb-key.js YOUR_ACTUAL_KEY");
console.log("   3. Restart your backend server");
console.log("\n💡 The backend is configured to read TMDB_API_KEY from .env automatically");

