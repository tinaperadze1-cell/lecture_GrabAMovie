/**
 * Test script to verify n8n webhook is working
 * Run with: node test-webhook.js
 */

const axios = require("axios");

// Try production webhook first, fallback to test if needed
const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://tperadze.app.n8n.cloud/webhook/ticket-deleted";
const testPayload = {
  ticketId: 999,
  bookingReference: "TEST-BK-001",
  userId: 1,
  userEmail: "test@example.com",
  username: "testuser",
  movieId: 1,
  movieTitle: "Test Movie",
  showingId: 1,
  showtime: new Date().toISOString(),
  theaterName: "Test Theater",
  totalAmount: 25.50,
  bookingDate: new Date().toISOString(),
  status: "confirmed",
  deletionReason: "Test webhook call",
  deletedBy: 1,
  deletedAt: new Date().toISOString(),
};

console.log("🧪 Testing n8n webhook...");
console.log(`📍 URL: ${webhookUrl}`);
console.log(`📦 Payload:`, JSON.stringify(testPayload, null, 2));
console.log("\n");

axios
  .post(webhookUrl, testPayload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  })
  .then((response) => {
    console.log("✅ SUCCESS! Webhook responded:");
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ FAILED! Webhook error:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      console.error(`   Headers:`, error.response.headers);
    } else if (error.request) {
      console.error(`   No response received`);
      console.error(`   Error:`, error.message);
    } else {
      console.error(`   Error:`, error.message);
    }
    process.exit(1);
  });

