# Step-by-Step Deployment Guide
## GRABAMOVIE - Complete Deployment Instructions

This guide will walk you through deploying your application step-by-step with exact instructions.

---

## 📋 PREREQUISITES CHECKLIST

Before starting, make sure you have:

- [ ] A Google account (Gmail)
- [ ] A GitHub account
- [ ] A Vercel account (can create during deployment)
- [ ] A Cloudinary account (can create during deployment)
- [ ] Credit card for Google Cloud (free tier available, but card required)

**Estimated Total Time**: 45-60 minutes

---

## PART 1: SET UP GOOGLE CLOUD PROJECT (10 minutes)

### Step 1.1: Create Google Cloud Account

1. Go to: https://console.cloud.google.com/
2. Click **"Get Started for Free"** or **"Sign In"** if you have an account
3. If new account:
   - Enter your email
   - Accept terms
   - Enter credit card (required, but free tier available)
   - Complete verification

### Step 1.2: Create a New Project

1. In Google Cloud Console, click the **project dropdown** at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `grabamovie` (or any name you prefer)
   - **Project ID**: Will auto-generate (note this down, you'll need it)
4. Click **"Create"**
5. Wait 10-20 seconds for project creation
6. Select your new project from the dropdown

### Step 1.3: Enable Billing

1. Click the **hamburger menu** (☰) in top left
2. Go to **"Billing"**
3. Click **"Link a billing account"**
4. If you don't have one:
   - Click **"Create billing account"**
   - Fill in details
   - Link your credit card
5. Select your billing account
6. Click **"Set account"**

### Step 1.4: Enable Required APIs

1. Click the **hamburger menu** (☰)
2. Go to **"APIs & Services"** → **"Library"**
3. Search for and enable these APIs (click each, then click "Enable"):
   - **Cloud Run API**
   - **Cloud Build API**
   - **Cloud SQL Admin API**
   - **Container Registry API**

---

## PART 2: SET UP GOOGLE CLOUD SQL DATABASE (15 minutes)

### Step 2.1: Create PostgreSQL Instance

1. Click the **hamburger menu** (☰)
2. Go to **"SQL"** (under "Databases")
3. Click **"Create Instance"** button
4. Click **"Choose PostgreSQL"**
5. Fill in the form:

   **Instance ID**: `grabamovie-db`
   
   **Password**: 
   - Click **"Generate"** or create your own strong password
   - **IMPORTANT**: Copy and save this password in a text file!
   - Example: `MySecurePass123!@#`
   
   **Database Version**: Select **PostgreSQL 15** or **16**
   
   **Region**: 
   - Choose closest to you (e.g., `us-central1`, `us-east1`, `europe-west1`)
   - **Note this down!**
   
   **Zone**: Leave default
   
   **Machine Type**: 
   - Click **"Show configuration options"**
   - Click **"Machine type"**
   - Select **"db-f1-micro"** (free tier) or **"db-g1-small"** (small cost)
   - Click **"Done"**

6. Scroll down and click **"Create Instance"**
7. Wait 3-5 minutes for instance to be created

### Step 2.2: Create Database

1. Once instance is created, click on **"grabamovie-db"** (or your instance name)
2. Click the **"Databases"** tab at the top
3. Click **"Create database"**
4. Enter database name: `grabamovie`
5. Click **"Create"**

### Step 2.3: Get Connection Information

1. Still in your SQL instance page
2. Click the **"Overview"** tab
3. Find **"Connection name"** (format: `project-id:region:instance-name`)
   - Example: `my-project-12345:us-central1:grabamovie-db`
4. **Copy this connection name** - save it in your text file
5. Also note:
   - **Region**: (e.g., `us-central1`)
   - **Instance name**: `grabamovie-db`

### Step 2.4: Get Database Connection String

Your connection string format will be:
```
postgresql://postgres:YOUR_PASSWORD@/grabamovie?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

**Example**:
```
postgresql://postgres:MySecurePass123!@#@/grabamovie?host=/cloudsql/my-project-12345:us-central1:grabamovie-db
```

**Save this in your text file!** You'll need it later.

---

## PART 3: SET UP CLOUDINARY (5 minutes)

### Step 3.1: Create Cloudinary Account

1. Go to: https://cloudinary.com/
2. Click **"Sign Up For Free"**
3. Fill in:
   - Email
   - Password
   - Name
4. Verify your email
5. Log in

### Step 3.2: Get Cloudinary URL

1. Once logged in, you'll see your **Dashboard**
2. Look for **"Account Details"** or click **"Settings"** (gear icon)
3. Find **"Cloudinary URL"** or **"API Environment variable"**
   - Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
   - Example: `cloudinary://123456789:abcdefghijklmnop@my-cloud-name`
4. **Copy this entire URL** - save it in your text file

---

## PART 4: GET TMDB API KEY (Optional - 3 minutes)

### Step 4.1: Create TMDB Account

1. Go to: https://www.themoviedb.org/
2. Click **"Sign Up"**
3. Create account
4. Verify email

### Step 4.2: Get API Key

1. Go to: https://www.themoviedb.org/settings/api
2. Click **"Request an API Key"**
3. Select **"Developer"**
4. Fill in:
   - Application name: `GRABAMOVIE`
   - Application URL: `http://localhost` (for now)
   - Application summary: `Movie discovery platform`
5. Accept terms and submit
6. Copy your **API Key** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
7. **Save it in your text file**

---

## PART 5: DEPLOY BACKEND TO GOOGLE CLOUD RUN (15 minutes)

### Step 5.1: Install Google Cloud SDK (If Not Installed)

**For Windows:**
1. Download: https://cloud.google.com/sdk/docs/install-sdk#windows
2. Run the installer
3. Follow installation wizard
4. Restart your terminal/PowerShell

**For Mac:**
```bash
# In terminal
brew install --cask google-cloud-sdk
```

**For Linux:**
```bash
# Follow: https://cloud.google.com/sdk/docs/install-sdk#linux
```

### Step 5.2: Authenticate with Google Cloud

1. Open **PowerShell** (Windows) or **Terminal** (Mac/Linux)
2. Run:
   ```bash
   gcloud auth login
   ```
3. Browser will open - select your Google account
4. Allow permissions
5. Return to terminal

### Step 5.3: Set Your Project

1. In terminal, run:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
   Replace `YOUR_PROJECT_ID` with your actual project ID from Step 1.2
   
   Example:
   ```bash
   gcloud config set project my-project-12345
   ```

2. Verify:
   ```bash
   gcloud config get-value project
   ```
   Should show your project ID

### Step 5.4: Build Docker Image

1. Navigate to your project folder:
   ```bash
   cd C:\LECTURE_PROJECT_TINA\backend
   ```

2. Build the image:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/grabamovie-backend
   ```
   Replace `YOUR_PROJECT_ID` with your actual project ID
   
   Example:
   ```bash
   gcloud builds submit --tag gcr.io/my-project-12345/grabamovie-backend
   ```

3. Wait 3-5 minutes for build to complete
4. You'll see: `SUCCESS`

### Step 5.5: Deploy to Cloud Run

1. Still in terminal, run this command (replace all placeholders):

```bash
gcloud run deploy grabamovie-backend \
  --image gcr.io/YOUR_PROJECT_ID/grabamovie-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@/grabamovie?host=/cloudsql/YOUR_CONNECTION_NAME" \
  --set-env-vars NODE_ENV="production" \
  --set-env-vars PORT="8080" \
  --set-env-vars CLOUDINARY_URL="YOUR_CLOUDINARY_URL" \
  --set-env-vars TMDB_API_KEY="YOUR_TMDB_KEY" \
  --set-env-vars JWT_SECRET="GENERATE_RANDOM_STRING_HERE" \
  --set-env-vars DATABASE_SSL="true" \
  --add-cloudsql-instances YOUR_CONNECTION_NAME
```

**Replace these values:**
- `YOUR_PROJECT_ID`: Your project ID from Step 1.2
- `YOUR_PASSWORD`: Database password from Step 2.1
- `YOUR_CONNECTION_NAME`: Connection name from Step 2.3
- `YOUR_CLOUDINARY_URL`: Cloudinary URL from Step 3.2
- `YOUR_TMDB_KEY`: TMDB API key from Step 4.2 (or leave empty if not using)
- `GENERATE_RANDOM_STRING_HERE`: Generate a random string (e.g., `MySecretJWTKey123!@#`)

**Example command:**
```bash
gcloud run deploy grabamovie-backend \
  --image gcr.io/my-project-12345/grabamovie-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://postgres:MySecurePass123!@#@/grabamovie?host=/cloudsql/my-project-12345:us-central1:grabamovie-db" \
  --set-env-vars NODE_ENV="production" \
  --set-env-vars PORT="8080" \
  --set-env-vars CLOUDINARY_URL="cloudinary://123456789:abcdefghijklmnop@my-cloud-name" \
  --set-env-vars TMDB_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  --set-env-vars JWT_SECRET="MySecretJWTKey123!@#" \
  --set-env-vars DATABASE_SSL="true" \
  --add-cloudsql-instances my-project-12345:us-central1:grabamovie-db
```

2. Wait 2-3 minutes for deployment
3. You'll see: **Service URL**: `https://grabamovie-backend-xxxxx.run.app`
4. **Copy this URL** - save it in your text file!

### Step 5.6: Test Backend

1. Open browser
2. Go to: `https://YOUR_BACKEND_URL/api/movies`
   - Replace `YOUR_BACKEND_URL` with the URL from Step 5.5
3. You should see JSON data (or empty array `[]`)
4. If you see data or empty array, backend is working! ✅

---

## PART 6: RUN DATABASE MIGRATIONS (10 minutes)

### Step 6.1: Download Cloud SQL Proxy

**For Windows:**
1. Go to: https://dl.google.com/cloudsql/cloud_sql_proxy_x64.exe
2. Save as `cloud_sql_proxy.exe` in `C:\Users\YOUR_USERNAME\`
3. Or download to your project folder

**For Mac/Linux:**
```bash
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy
```

### Step 6.2: Start Cloud SQL Proxy

1. Open a **NEW** terminal/PowerShell window
2. Navigate to where you saved the proxy:
   ```bash
   cd C:\Users\YOUR_USERNAME
   ```
3. Run (replace with your connection name):
   ```bash
   .\cloud_sql_proxy.exe -instances=YOUR_CONNECTION_NAME=tcp:5432
   ```
   
   Example:
   ```bash
   .\cloud_sql_proxy.exe -instances=my-project-12345:us-central1:grabamovie-db=tcp:5432
   ```

4. You should see: `Ready for new connections`
5. **Keep this terminal open!**

### Step 6.3: Set Up Local Database Connection

1. In your **original** terminal, navigate to backend:
   ```bash
   cd C:\LECTURE_PROJECT_TINA\backend
   ```

2. Create `.env` file:
   ```bash
   # Windows PowerShell
   New-Item -Path .env -ItemType File
   
   # Or use a text editor to create .env file
   ```

3. Open `.env` file in text editor and add:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/grabamovie
   NODE_ENV=development
   PORT=4000
   CLOUDINARY_URL=YOUR_CLOUDINARY_URL
   TMDB_API_KEY=YOUR_TMDB_KEY
   JWT_SECRET=YOUR_JWT_SECRET
   DATABASE_SSL=false
   ```
   
   Replace:
   - `YOUR_PASSWORD`: Database password
   - `YOUR_CLOUDINARY_URL`: Your Cloudinary URL
   - `YOUR_TMDB_KEY`: Your TMDB key
   - `YOUR_JWT_SECRET`: Same JWT secret from Step 5.5

4. Save the file

### Step 6.4: Install Dependencies and Run Migrations

1. In terminal (backend folder), run:
   ```bash
   npm install
   ```

2. Run database initialization:
   ```bash
   npm run init-db
   ```

3. Wait for completion
4. You should see: `✅ Database initialized successfully` or similar

---

## PART 7: DEPLOY FRONTEND TO VERCEL (10 minutes)

### Step 7.1: Create Vercel Account

1. Go to: https://vercel.com/
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub
5. Complete signup

### Step 7.2: Import Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository: `tinaperadze1-cell/lecture_GrabAMovie`
3. Click **"Import"**

### Step 7.3: Configure Project Settings

1. **Framework Preset**: Should auto-detect as **"Vite"** (if not, select it)
2. **Root Directory**: Click **"Edit"** and set to: `frontend`
3. **Build Command**: Should be: `npm run build` (verify)
4. **Output Directory**: Should be: `dist` (verify)
5. **Install Command**: Should be: `npm install` (verify)

### Step 7.4: Add Environment Variable

1. Scroll down to **"Environment Variables"**
2. Click **"Add"** or **"Add Environment Variable"**
3. Enter:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://YOUR_BACKEND_URL/api`
     - Replace `YOUR_BACKEND_URL` with the URL from Step 5.5
     - Example: `https://grabamovie-backend-xxxxx.run.app/api`
4. Click **"Save"**

### Step 7.5: Deploy

1. Scroll to bottom
2. Click **"Deploy"** button
3. Wait 2-3 minutes for deployment
4. You'll see: **"Congratulations! Your project has been deployed."**
5. Click on the deployment URL (e.g., `https://lecture-grab-a-movie.vercel.app`)
6. **Copy this URL** - save it in your text file!

---

## PART 8: UPDATE CORS SETTINGS (5 minutes)

### Step 8.1: Update Backend CORS

1. Go back to Google Cloud Console
2. Click **hamburger menu** (☰) → **"Cloud Run"**
3. Click on **"grabamovie-backend"**
4. Click **"EDIT & DEPLOY NEW REVISION"** (top right)
5. Scroll to **"Variables & Secrets"**
6. Click **"ADD VARIABLE"**
7. Enter:
   - **Name**: `ALLOWED_ORIGINS`
   - **Value**: `https://YOUR_VERCEL_URL`
     - Replace with your Vercel URL from Step 7.5
     - Example: `https://lecture-grab-a-movie.vercel.app`
8. Scroll down and click **"DEPLOY"**
9. Wait 1-2 minutes

---

## PART 9: VERIFY DEPLOYMENT (5 minutes)

### Step 9.1: Test Backend

1. Open browser
2. Go to: `https://YOUR_BACKEND_URL/api/movies`
3. Should see JSON response (even if empty array `[]`)
4. ✅ Backend is working!

### Step 9.2: Test Frontend

1. Go to your Vercel URL
2. Page should load
3. Try these:
   - Browse movies
   - Register a new account
   - Login
   - Add movie to favorites
   - Take a quiz

### Step 9.3: Check for Errors

1. Open browser **Developer Tools** (F12)
2. Go to **"Console"** tab
3. Look for any red errors
4. If you see CORS errors:
   - Go back to Step 8.1
   - Make sure Vercel URL is in ALLOWED_ORIGINS
   - Redeploy

---

## PART 10: FINAL CHECKLIST

Verify everything:

- [ ] Backend URL is accessible: `https://YOUR_BACKEND_URL/api/movies`
- [ ] Frontend loads at Vercel URL
- [ ] Can register new user
- [ ] Can login
- [ ] Can browse movies
- [ ] Can add to favorites
- [ ] No console errors in browser
- [ ] Database migrations completed

---

## 🎉 CONGRATULATIONS!

Your application is now deployed! 

**Your URLs:**
- **Frontend**: `https://YOUR_VERCEL_URL`
- **Backend**: `https://YOUR_BACKEND_URL`

---

## 🆘 TROUBLESHOOTING

### Backend Not Working?

1. Check Cloud Run logs:
   - Google Cloud Console → Cloud Run → grabamovie-backend → Logs
2. Verify environment variables are set correctly
3. Check DATABASE_URL format

### Frontend Can't Connect to Backend?

1. Check browser console (F12) for errors
2. Verify `VITE_API_BASE_URL` in Vercel matches backend URL
3. Check CORS settings (Step 8.1)

### Database Connection Issues?

1. Make sure Cloud SQL instance is running
2. Verify DATABASE_URL format
3. Check Cloud SQL connection is added to Cloud Run service

### Build Failures?

1. Check build logs in Vercel/Cloud Build
2. Verify Node.js version (should be 20.x)
3. Check all dependencies in package.json

---

## 📞 NEED HELP?

- Check logs in:
  - Google Cloud Console → Cloud Run → Logs
  - Vercel Dashboard → Deployments → View Function Logs
- Review error messages carefully
- Make sure all environment variables are set correctly

---

## 💰 COST MONITORING

1. Google Cloud Console → Billing → Budgets & alerts
2. Set up budget alerts to avoid surprises
3. Free tier covers most development needs

---

**You're all set! Enjoy your deployed application! 🚀**

