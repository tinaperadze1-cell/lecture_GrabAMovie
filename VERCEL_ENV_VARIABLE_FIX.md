# Fix Vercel Environment Variable Error

## Error
```
Environment Variable "VITE_API_BASE_URL" references Secret "vite_api_base_url", which does not exist.
```

## Solution

The `vercel.json` file was trying to reference a secret that doesn't exist. I've fixed the file, but you need to add the environment variable directly in Vercel's UI.

### Step 1: Remove the Error (Already Fixed)

The `vercel.json` file has been updated to remove the secret reference. The file is now clean.

### Step 2: Add Environment Variable in Vercel UI

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project**: `lecture_GrabAMovie`
3. **Click "Settings"** (gear icon in top right)
4. **Click "Environment Variables"** in the left sidebar
5. **Click "Add New"** button
6. **Enter**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL + `/api`
     - Example: `https://grabamovie-backend-xxxxx.run.app/api`
     - **Important**: Replace `xxxxx` with your actual Cloud Run service URL
   - **Environments**: Check all three:
     - ☑ Production
     - ☑ Preview
     - ☑ Development
7. **Click "Save"**

### Step 3: Redeploy

1. **Go to "Deployments"** tab
2. **Click the three dots (...)** on the latest deployment
3. **Click "Redeploy"**
4. **Or make a new commit** to trigger auto-deployment:
   ```bash
   git add .
   git commit -m "Fix Vercel config"
   git push origin master
   ```

### Step 4: Verify

1. Wait 1-2 minutes for deployment
2. Check deployment logs - should show "Build Successful"
3. Visit your Vercel URL - site should load!

## Important Notes

- **Don't use secrets** for this - just add it as a regular environment variable
- The value should be your **full backend URL** + `/api`
- Make sure to check all three environments (Production, Preview, Development)
- After adding the variable, you **must redeploy** for it to take effect

## Example

If your backend URL is:
```
https://grabamovie-backend-abc123.run.app
```

Then your `VITE_API_BASE_URL` should be:
```
https://grabamovie-backend-abc123.run.app/api
```

## Still Having Issues?

1. Make sure you've deployed your backend first (get the URL from Google Cloud Run)
2. Verify the backend URL is accessible: Visit `https://your-backend-url/api/movies` in browser
3. Check Vercel deployment logs for any build errors
4. Make sure the environment variable name is exactly: `VITE_API_BASE_URL` (case-sensitive)

