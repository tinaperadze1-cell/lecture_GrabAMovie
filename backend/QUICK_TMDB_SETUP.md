# 🚀 Quick TMDB API Setup (2 Minutes)

## The Problem
You're seeing: "No newly released movies available" because the TMDB API key is missing.

## The Solution (3 Steps)

### Step 1: Get Your Free API Key (1 minute)
1. Go to: **https://www.themoviedb.org/signup**
2. Create a free account (takes 30 seconds)
3. After logging in, go to: **https://www.themoviedb.org/settings/api**
4. Click **"Request an API Key"**
5. Select **"Developer"**
6. Fill the form:
   - Application Name: `GRABAMOVIE`
   - Application URL: `http://localhost:4000`
   - Application Summary: `Movie booking platform`
7. Click **"Submit"**
8. **Copy your API key** (it looks like: `abc123def456ghi789...`)

### Step 2: Add It to Your .env File (30 seconds)
1. Open the file: `backend/.env` (in your code editor)
2. Look for a line that says `TMDB_API_KEY=` (or add it if it doesn't exist)
3. Add your key after the `=` sign:
   ```
   TMDB_API_KEY=abc123def456ghi789jkl012mno345pq
   ```
   ⚠️ **Important**: Replace `abc123def456ghi789jkl012mno345pq` with YOUR actual API key!

4. **Save the file**

### Step 3: Restart Backend (10 seconds)
1. Go to your backend terminal (where `npm run dev` is running)
2. Press **Ctrl+C** to stop it
3. Run: `npm run dev` again
4. You should see: `✅ TMDB_API_KEY is configured`

## ✅ Verify It Works
1. Refresh your frontend page
2. Click the Floating Action Button (☰) at bottom right
3. Click "Soon to be Released"
4. You should see real movies! 🎉

## 🆘 Still Not Working?

### Check 1: Is the key in the right place?
- File must be: `backend/.env` (not `backend/src/.env` or anywhere else)
- Line must be: `TMDB_API_KEY=your_key_here` (no quotes, no spaces around `=`)

### Check 2: Did you restart the backend?
- You MUST restart the backend server after adding the key
- Look for `✅ TMDB_API_KEY is configured` in the backend console

### Check 3: Test the API directly
Run this in your backend directory:
```bash
node test-tmdb.js
```

If it says "✅ SUCCESS!", your key works. If it says "❌ ERROR", check the error message.

## 📞 Need More Help?
- Check `backend/TMDB_SETUP.md` for detailed instructions
- Check your browser console (F12) for error messages
- Check your backend console for warnings

---

**Remember**: The API key is FREE and takes 2 minutes to set up. Once it's done, you'll see real movies automatically! 🎬

