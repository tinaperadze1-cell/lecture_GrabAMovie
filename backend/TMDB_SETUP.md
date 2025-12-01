# TMDB API Setup Guide

This guide will help you set up the TMDB (The Movie Database) API key to enable the "Soon to be Released" feature.

## Step 1: Get a Free TMDB API Key

1. **Create an Account** (if you don't have one):
   - Go to https://www.themoviedb.org/signup
   - Sign up for a free account (it's completely free!)

2. **Request an API Key**:
   - After logging in, go to: https://www.themoviedb.org/settings/api
   - Click on "Request an API Key"
   - Select "Developer" as the type
   - Fill out the form:
     - **Application Name**: GRABAMOVIE (or any name you prefer)
     - **Application URL**: http://localhost:4000 (or your local URL)
     - **Application Summary**: Movie booking and rating platform
   - Accept the terms and submit
   - You'll receive your API key (it looks like: `abc123def456ghi789jkl012mno345pq`)

## Step 2: Add API Key to Your .env File

1. **Open the `.env` file** in the `backend/` directory

2. **Add the following line** (replace `your_api_key_here` with your actual API key):
   ```
   TMDB_API_KEY=your_api_key_here
   ```

   Example:
   ```
   TMDB_API_KEY=abc123def456ghi789jkl012mno345pq
   ```

3. **Save the file**

## Step 3: Restart Your Backend Server

After adding the API key, you need to restart your backend server:

1. Stop the current server (Ctrl+C in the terminal where it's running)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

## Step 4: Verify It's Working

1. Open your frontend application
2. Click on the Floating Action Button (☰) at the bottom right
3. Click "Soon to be Released"
4. You should now see real movies from TMDB!

## Troubleshooting

### Still seeing "No newly released movies available"?

1. **Check if the API key is correct**:
   - Make sure there are no extra spaces in the `.env` file
   - The line should be exactly: `TMDB_API_KEY=your_key_here` (no quotes needed)

2. **Check backend console**:
   - Look for any error messages in the backend terminal
   - You might see: `⚠️  TMDB_API_KEY not configured` if the key isn't being read

3. **Verify the .env file location**:
   - The `.env` file should be in the `backend/` directory (same level as `package.json`)

4. **Check if dotenv is loading the file**:
   - The backend uses `dotenv` to load environment variables
   - Make sure `require("dotenv").config()` is called in your server files

### API Rate Limits

- TMDB free tier allows **40 requests per 10 seconds**
- This should be more than enough for normal usage
- If you hit the limit, wait a few seconds and try again

## Need Help?

If you're still having issues:
1. Check the backend console for error messages
2. Verify your API key is active at https://www.themoviedb.org/settings/api
3. Make sure your backend server is running and has been restarted after adding the key

---

**Note**: The TMDB API is completely free and doesn't require any payment. The free tier is sufficient for development and personal use.

