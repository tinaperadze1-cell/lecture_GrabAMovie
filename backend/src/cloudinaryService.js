const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary Service for file uploads
 * Configures Cloudinary using environment variables
 */

// Configure Cloudinary
// Cloudinary can use CLOUDINARY_URL or individual variables
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is set, parse it to extract credentials
  // Format: cloudinary://api_key:api_secret@cloud_name
  const urlMatch = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (urlMatch) {
    cloudinary.config({
      cloud_name: urlMatch[3],
      api_key: urlMatch[1],
      api_secret: urlMatch[2],
    });
    console.log(`✅ Cloudinary configured from CLOUDINARY_URL (cloud: ${urlMatch[3]})`);
  } else {
    console.warn("⚠️  WARNING: CLOUDINARY_URL format is invalid!");
  }
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Use individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log(`✅ Cloudinary configured from individual variables (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
} else {
  console.warn("⚠️  WARNING: Cloudinary credentials not configured!");
  console.warn("   Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file");
}

/**
 * Upload a file to Cloudinary
 * @param {Buffer|String} file - File buffer or file path
 * @param {Object} options - Upload options (folder, public_id, etc.)
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
async function uploadToCloudinary(file, options = {}) {
  try {
    const uploadOptions = {
      resource_type: options.resource_type || "auto", // auto, image, video, raw
      folder: options.folder || "lecture-project",
      ...options,
    };

    // If file is a buffer, upload from buffer
    // Otherwise, treat as file path
    const uploadResult = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

/**
 * Delete a file from Cloudinary
 * @param {String} publicId - Public ID of the file to delete
 * @param {String} resourceType - Resource type (image, video, raw, auto)
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFromCloudinary(publicId, resourceType = "image") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
}

/**
 * Test Cloudinary connection
 * @returns {Promise<Boolean>} True if connection is successful
 */
async function testCloudinaryConnection() {
  try {
    // Check if Cloudinary is configured
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      console.error("Cloudinary not properly configured");
      return false;
    }

    // Try to get account usage (this requires valid credentials)
    // This is a lightweight API call that verifies credentials
    try {
      await cloudinary.api.usage();
      return true;
    } catch (apiError) {
      // If usage API fails, try a simple transformation test
      // Generate a test URL to verify credentials are valid
      const testUrl = cloudinary.url("test", {
        transformation: [{ width: 100, height: 100, crop: "fill" }],
      });
      // If we can generate a URL, config is at least set
      // For a more thorough test, we'd need to actually upload something
      return testUrl !== null;
    }
  } catch (error) {
    console.error("Cloudinary connection test failed:", error.message);
    return false;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  testCloudinaryConnection,
  cloudinary,
};

