# Quick Start: Fetch IMDB Ratings

## Step 1: Get Free OMDB API Key

1. **Visit**: http://www.omdbapi.com/apikey.aspx
2. **Select**: FREE tier (1,000 requests per day - perfect for your needs!)
3. **Enter**: Your email address
4. **Check**: Your email inbox for activation link
5. **Click**: The activation link in the email
6. **Copy**: Your API key (it will look like: `abc123def456`)

## Step 2: Add API Key to .env File

Open `backend/.env` file and add this line:

```env
OMDB_API_KEY=your_actual_api_key_here
```

**Example:**
```env
DATABASE_URL=postgresql://...
OMDB_API_KEY=abc123def456
PORT=4000
```

## Step 3: Fetch Ratings

Run this command:

```bash
cd backend
npm run fetch-imdb-ratings
```

This will:
- ✅ Fetch IMDB ratings for all 138 movies
- ✅ Update the Neon database
- ✅ Show progress and results
- ✅ Handle rate limits automatically

## That's It!

After running the script, all your movies will have current IMDB ratings stored in the Neon database!

**Note**: The system will automatically update ratings daily at 2:00 AM, so you only need to run this once (or whenever you want to manually refresh).

