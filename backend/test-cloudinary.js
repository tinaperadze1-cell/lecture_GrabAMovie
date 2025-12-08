/**
 * Test script to verify Cloudinary connection
 * Run with: node test-cloudinary.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { testCloudinaryConnection, uploadToCloudinary } = require("./src/cloudinaryService");

async function testConnection() {
  console.log("🔍 Testing Cloudinary connection...\n");

  // Check if credentials are set
  if (process.env.CLOUDINARY_URL) {
    console.log("✅ CLOUDINARY_URL is set in .env");
    const urlMatch = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (urlMatch) {
      console.log(`   Cloud Name: ${urlMatch[3]}`);
      console.log(`   API Key: ${urlMatch[1].substring(0, 8)}...`);
    }
  } else if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log("✅ Cloudinary credentials found in .env");
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  } else {
    console.log("❌ No Cloudinary credentials found in .env");
    console.log("   Please set CLOUDINARY_URL or individual credentials");
    process.exit(1);
  }

  console.log("\n📡 Testing connection to Cloudinary...");
  const isConnected = await testCloudinaryConnection();

  if (isConnected) {
    console.log("✅ Cloudinary connection successful!\n");
    console.log("🎉 Your Cloudinary integration is working correctly.");
    console.log("\n📝 Available endpoints:");
    console.log("   POST /api/upload - Upload a single file");
    console.log("   POST /api/upload/multiple - Upload multiple files");
    console.log("   DELETE /api/upload/:publicId - Delete a file");
    console.log("   GET /api/upload/test - Test connection");
  } else {
    console.log("❌ Cloudinary connection failed!");
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Check your CLOUDINARY_URL in backend/.env");
    console.log("   2. Verify your API key and secret are correct");
    console.log("   3. Make sure your Cloudinary account is active");
    process.exit(1);
  }
}

testConnection().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});

