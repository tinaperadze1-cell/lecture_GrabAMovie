# 🔑 Add TMDB API Key - Step by Step

## Current Status
✅ Frontend is working correctly  
✅ Backend is detecting missing API key  
❌ TMDB_API_KEY needs to be added to backend/.env

---

## Quick Fix (Choose One Method)

### Method 1: Using the Helper Script (Easiest)

1. **Get your API key first:**
   - Go to: https://www.themoviedb.org/settings/api
   - Sign up/login (free, takes 1 minute)
   - Click "Request an API Key" → Select "Developer"
   - Fill form and submit
   - **Copy your API key**

2. **Run this command** (replace YOUR_KEY with your actual key):
   ```bash
   cd backend
   node add-tmdb-key.js YOUR_ACTUAL_API_KEY_HERE
   ```

3. **Restart backend:**
   - Press Ctrl+C in backend terminal
   - Run: `npm run dev`

---

### Method 2: Manual Edit (If script doesn't work)

1. **Get your API key:**
   - Go to: https://www.themoviedb.org/settings/api
   - Get your free API key

2. **Open `backend/.env` file** in your code editor
   - If it doesn't exist, create it in the `backend` folder

3. **Add or edit this line:**
   ```
   TMDB_API_KEY=your_actual_key_here
   ```
   **Example:**
   ```
   TMDB_API_KEY=abc123def456ghi789jkl012mno345pq
   ```
   ⚠️ **Important:** 
   - No quotes around the key
   - No spaces around the `=` sign
   - Replace `your_actual_key_here` with YOUR real key

4. **Save the file**

5. **Restart your backend server:**
   - Stop it (Ctrl+C)
   - Start it: `npm run dev`
   - Look for: `✅ TMDB_API_KEY is configured`

---

## Verify It Works

After adding the key and restarting:

1. **Check backend console** - Should show:
   ```
   ✅ TMDB_API_KEY is configured
   ```

2. **Refresh frontend page**

3. **Click Floating Action Button (☰)** → "Soon to be Released"

4. **You should see real movies!** 🎉

---

## Still Not Working?

### Check 1: File Location
- File must be: `backend/.env` (not `backend/src/.env`)
- Same folder as `backend/package.json`

### Check 2: Key Format
- ✅ Correct: `TMDB_API_KEY=abc123def456`
- ❌ Wrong: `TMDB_API_KEY = abc123def456` (spaces)
- ❌ Wrong: `TMDB_API_KEY="abc123def456"` (quotes)
- ❌ Wrong: `TMDB_API_KEY=` (empty)

### Check 3: Restart Backend
- You MUST restart after adding the key
- Look for the ✅ message in console

### Check 4: Test the Key
Run this to test:
```bash
cd backend
node test-tmdb.js
```

If it says "✅ SUCCESS!", your key works!

---

## Need Your API Key?

1. Go to: **https://www.themoviedb.org/signup** (create free account)
2. Then go to: **https://www.themoviedb.org/settings/api**
3. Click "Request an API Key"
4. Select "Developer"
5. Fill the form and submit
6. Copy your key

**It's 100% free and takes 2 minutes!**

