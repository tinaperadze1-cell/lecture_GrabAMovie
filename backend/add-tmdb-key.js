/**
 * Helper script to add TMDB API key to .env file
 * Usage: node add-tmdb-key.js YOUR_API_KEY_HERE
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const apiKey = process.argv[2];

console.log("🔧 TMDB API Key Setup Helper\n");

if (!apiKey) {
  console.log("❌ Please provide your TMDB API key as an argument");
  console.log("\n📋 Usage:");
  console.log("   node add-tmdb-key.js YOUR_API_KEY_HERE");
  console.log("\n📝 To get your API key:");
  console.log("   1. Go to: https://www.themoviedb.org/settings/api");
  console.log("   2. Request an API key (it's free!)");
  console.log("   3. Copy your API key");
  console.log("   4. Run: node add-tmdb-key.js YOUR_API_KEY");
  process.exit(1);
}

// Check if .env exists, create with default content if not
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env file...");
  // Try to preserve existing DATABASE_URL if set
  const defaultContent = `# Database Configuration
DATABASE_URL=${process.env.DATABASE_URL || "your_database_url_here"}

# TMDB API Key
TMDB_API_KEY=${apiKey}

# IMDB API Key (Optional)
OMDB_API_KEY=${process.env.OMDB_API_KEY || "ca478e54"}
`;
  fs.writeFileSync(envPath, defaultContent);
  console.log("✅ Created .env file with TMDB_API_KEY");
  process.exit(0);
}

// Read current .env content
let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
}

// Check if TMDB_API_KEY already exists
if (envContent.includes("TMDB_API_KEY")) {
  // Replace existing key (including placeholder)
  const lines = envContent.split("\n");
  const updatedLines = lines.map(line => {
    const trimmed = line.trim();
    // Match TMDB_API_KEY with or without value, including placeholder
    if (trimmed.startsWith("TMDB_API_KEY") || trimmed.startsWith("#TMDB_API_KEY")) {
      return `TMDB_API_KEY=${apiKey}`;
    }
    return line;
  });
  envContent = updatedLines.join("\n");
  
  // If key wasn't replaced (might be commented out), add it
  if (!envContent.includes(`TMDB_API_KEY=${apiKey}`)) {
    if (!envContent.endsWith("\n")) {
      envContent += "\n";
    }
    envContent += `TMDB_API_KEY=${apiKey}\n`;
  }
} else {
  // Add new key
  if (envContent && !envContent.endsWith("\n")) {
    envContent += "\n";
  }
  envContent += `\n# TMDB API Key\nTMDB_API_KEY=${apiKey}\n`;
}

// Write back to .env
fs.writeFileSync(envPath, envContent);

console.log("✅ TMDB_API_KEY has been added to .env file!");
console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
console.log("\n🔄 Next steps:");
console.log("   1. Restart your backend server (stop with Ctrl+C, then run 'npm run dev')");
console.log("   2. Refresh your frontend page");
console.log("   3. Click the Floating Action Button and select 'Soon to be Released'");
console.log("\n🧪 To test if it works, run: node test-tmdb.js");

