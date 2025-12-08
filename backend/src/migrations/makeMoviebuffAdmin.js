const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { query } = require("../db");

/**
 * Make the moviebuff user an admin
 */
async function makeMoviebuffAdmin() {
  try {
    console.log("🔄 Making moviebuff user an admin...");

    // Check if moviebuff user exists
    const userCheck = await query("SELECT id, username, is_admin FROM users WHERE username = 'moviebuff'");
    
    if (userCheck.rows.length === 0) {
      console.log("⚠️  moviebuff user not found. Creating admin user...");
      await query(
        "INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)",
        ["moviebuff", "popcorn123", true]
      );
      console.log("✅ Created moviebuff user as admin");
    } else {
      // Update existing user to be admin
      await query(
        "UPDATE users SET is_admin = true WHERE username = 'moviebuff'"
      );
      console.log("✅ moviebuff user is now an admin");
    }

    // Verify
    const verify = await query("SELECT id, username, is_admin FROM users WHERE username = 'moviebuff'");
    if (verify.rows[0].is_admin) {
      console.log("🎉 Success! moviebuff is now an admin user");
      console.log("   Username: moviebuff");
      console.log("   Password: popcorn123");
    } else {
      console.log("⚠️  Warning: Could not verify admin status");
    }
  } catch (error) {
    console.error("❌ Error making moviebuff admin:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  makeMoviebuffAdmin()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      process.exit(1);
    });
}

module.exports = { makeMoviebuffAdmin };

