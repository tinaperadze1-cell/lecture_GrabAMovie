# How to Activate n8n Workflow for Webhooks

## The Problem
When you click "Execute Workflow" in n8n, it shows "waiting for you to call the test url". This is **TEST MODE** - it only works once for testing.

## The Solution
You need to **ACTIVATE** (publish) the workflow so it's always listening for webhooks.

## Step-by-Step Guide

### Step 1: Open Your Workflow in n8n
1. Go to your n8n dashboard
2. Click on your workflow that handles ticket deletion

### Step 2: Activate the Workflow
1. Look for the **"Active"** toggle/switch in the top right corner
2. OR click the **"Save and Activate"** button (not just "Save")
3. The workflow should show as **"Active"** (green indicator)

### Step 3: Get the Production Webhook URL
1. Click on your **Webhook node** in the workflow
2. Look for the webhook URL - it should show:
   - Production URL: `https://tperadze.app.n8n.cloud/webhook/ticket-deleted`
   - NOT the test URL: `https://tperadze.app.n8n.cloud/webhook-test/ticket-deleted`

### Step 4: Verify Workflow is Active
- The workflow should show a green "Active" badge
- The webhook node should show the production URL
- You should see "Production" mode, not "Test" mode

## Important Notes

### Test Mode vs Production Mode

**Test Mode** (when you click "Execute"):
- Shows "waiting for you to call the test url"
- Uses `/webhook-test/` URL
- Only works **once** after clicking Execute
- Good for testing, bad for production

**Production Mode** (when Activated):
- Workflow is always listening
- Uses `/webhook/` URL (no `-test`)
- Works automatically for every webhook call
- This is what you need!

## How to Check if It's Working

1. **In n8n:**
   - Go to "Executions" tab
   - You should see executions appear automatically when webhooks are received

2. **In your backend:**
   - Delete a ticket
   - Check console logs - you should see:
     ```
     ✅ n8n webhook notification sent successfully
     ```

3. **Test the webhook:**
   ```bash
   cd backend
   node test-webhook.js
   ```
   - Should return: `Status: 200` with `"message": "Workflow was started"`

## Troubleshooting

### If webhook still doesn't work:

1. **Make sure workflow is ACTIVE:**
   - Look for green "Active" indicator
   - If it says "Inactive", click "Save and Activate"

2. **Check the webhook URL in your backend:**
   - Should be: `https://tperadze.app.n8n.cloud/webhook/ticket-deleted`
   - NOT: `https://tperadze.app.n8n.cloud/webhook-test/ticket-deleted`

3. **Verify in n8n webhook node:**
   - The URL should match what's in your backend code
   - Make sure there are no typos

4. **Check n8n executions:**
   - Go to "Executions" tab
   - If you see executions appearing, the webhook is working
   - If nothing appears, the workflow isn't receiving webhooks

## Quick Checklist

- [ ] Workflow is **Activated** (green Active indicator)
- [ ] Webhook node shows production URL (`/webhook/` not `/webhook-test/`)
- [ ] Backend code uses production URL
- [ ] Test script works: `node backend/test-webhook.js`
- [ ] Executions appear in n8n when webhook is called

## Need Help?

If the workflow still shows "waiting for test url" after activation:
1. Make sure you clicked "Save and Activate" (not just "Execute")
2. Check if the workflow has any errors (red indicators)
3. Verify the webhook node is configured correctly
4. Try deactivating and reactivating the workflow

