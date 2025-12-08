const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { query } = require("./src/db");

async function checkAdminStatus() {
  try {
    console.log("Checking moviebuff admin status...\n");
    
    const result = await query("SELECT id, username, is_admin FROM users WHERE username = 'moviebuff'");
    
    if (result.rows.length === 0) {
      console.log("❌ moviebuff user not found!");
      return;
    }
    
    const user = result.rows[0];
    console.log("User found:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  is_admin: ${user.is_admin}`);
    console.log(`  is_admin type: ${typeof user.is_admin}`);
    
    if (!user.is_admin) {
      console.log("\n⚠️  User is NOT an admin. Making user an admin...");
      await query("UPDATE users SET is_admin = true WHERE username = 'moviebuff'");
      console.log("✅ User is now an admin!");
    } else {
      console.log("\n✅ User is already an admin!");
    }
    
    // Verify
    const verify = await query("SELECT id, username, is_admin FROM users WHERE username = 'moviebuff'");
    console.log("\nVerification:");
    console.log(`  is_admin: ${verify.rows[0].is_admin}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkAdminStatus();

