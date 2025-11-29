# IMDB Rating Integration Setup

This project integrates with the OMDB API to automatically fetch and update IMDB ratings for all movies in the database.

## Setup Instructions

### 1. Get a Free OMDB API Key

1. Visit http://www.omdbapi.com/apikey.aspx
2. Choose the **FREE** tier (1,000 requests per day)
3. Enter your email address
4. Check your email and click the activation link
5. Copy your API key

### 2. Add API Key to Environment Variables

Add your OMDB API key to the `.env` file in the `backend` folder:

```env
OMDB_API_KEY=your_api_key_here
```

If you don't have a `.env` file, create one with:

```env
DATABASE_URL=your_database_url
OMDB_API_KEY=your_omdb_api_key_here
PORT=4000
```

### 3. Initialize Database Schema

Make sure the database has the `updated_at` column:

```bash
npm run init-db
```

### 4. Start the Server

The scheduler will automatically start when you run the server:

```bash
npm run dev
# or
npm start
```

The scheduler runs daily at 2:00 AM to update all movie ratings.

## Manual Updates

### Update All Movies

You can manually trigger an update for all movies:

```bash
# Via API endpoint
POST http://localhost:4000/api/movies/update-all-imdb-ratings
```

### Update Single Movie

Update a specific movie's IMDB rating:

```bash
POST http://localhost:4000/api/movies/:id/update-imdb-rating
```

### Check API Usage

Check how many API requests you've used today:

```bash
GET http://localhost:4000/api/imdb/stats
```

## Features

- ✅ Automatic daily updates at 2:00 AM
- ✅ Rate limiting (max 900 requests/day to stay under 1,000 limit)
- ✅ Batch processing to avoid overwhelming the API
- ✅ Error handling and fallbacks
- ✅ Non-blocking updates (site doesn't freeze)
- ✅ Displays "Rating unavailable" when API fails
- ✅ Shows IMDB ratings on movie cards and detail pages

## Rate Limits

- **Free Tier**: 1,000 requests per day
- **Automatic Limit**: System stops at 900 requests to leave buffer
- **Reset**: Daily counter resets at midnight

## Troubleshooting

### "Invalid API key" error
- Make sure `OMDB_API_KEY` is set in `.env` file
- Verify the API key is correct
- Check that you activated the API key via email

### "Daily API limit reached"
- Wait until the next day (counter resets at midnight)
- Or upgrade to a paid OMDB plan for more requests

### Ratings not updating
- Check server logs for errors
- Verify database connection
- Ensure `updated_at` column exists in movies table

## Notes

- Ratings are updated in the background (non-blocking)
- Movies are processed in batches of 10 with 2-second delays
- If a movie isn't found in IMDB, the existing rating is kept
- The system gracefully handles API failures and shows fallback values

