# Quick Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] All code pushed to GitHub
- [x] Deployment configuration files created
- [x] Environment variable examples created
- [x] CORS configured for production
- [x] Database connection updated for production SSL

## 🚀 Next Steps to Deploy

### Step 1: Set Up Google Cloud SQL Database (15-20 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create PostgreSQL Instance**:
   - SQL → Create Instance → PostgreSQL
   - Instance ID: `grabamovie-db`
   - Set a strong password (SAVE IT!)
   - Region: Choose closest to you
   - Machine: `db-f1-micro` (free tier) or `db-g1-small`
3. **Create Database**:
   - Click on instance → Databases tab → Create Database
   - Name: `grabamovie`
4. **Get Connection String**:
   - Note the connection name (format: `project:region:instance`)
   - Format: `postgresql://postgres:YOUR_PASSWORD@/grabamovie?host=/cloudsql/PROJECT:REGION:INSTANCE`

### Step 2: Deploy Backend to Google Cloud Run (10-15 minutes)

**Option A: Using Google Cloud Console (Easiest)**

1. **Enable APIs**:
   - Go to APIs & Services → Enable:
     - Cloud Run API
     - Cloud Build API
     - Container Registry API

2. **Deploy via Cloud Build**:
   - Go to Cloud Build → Triggers
   - Connect your GitHub repository
   - Create trigger for `backend/` folder
   - Use `backend/cloudbuild.yaml` as build config

**Option B: Using Command Line**

```bash
# Install Google Cloud SDK first: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/grabamovie-backend

# Deploy to Cloud Run
gcloud run deploy grabamovie-backend \
  --image gcr.io/YOUR_PROJECT_ID/grabamovie-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="YOUR_DATABASE_URL" \
  --set-env-vars NODE_ENV="production" \
  --set-env-vars PORT="8080" \
  --set-env-vars CLOUDINARY_URL="YOUR_CLOUDINARY_URL" \
  --set-env-vars TMDB_API_KEY="YOUR_TMDB_KEY" \
  --set-env-vars JWT_SECRET="GENERATE_RANDOM_STRING" \
  --set-env-vars DATABASE_SSL="true" \
  --add-cloudsql-instances YOUR_CONNECTION_NAME
```

3. **Note your backend URL**: `https://grabamovie-backend-xxx.run.app`

### Step 3: Run Database Migrations (5 minutes)

```bash
# Option 1: Using Cloud SQL Proxy
# Download: https://cloud.google.com/sql/docs/postgres/sql-proxy
./cloud_sql_proxy -instances=YOUR_CONNECTION_NAME=tcp:5432

# In another terminal
cd backend
npm install
npm run init-db

# Option 2: Using Cloud Shell
gcloud sql connect YOUR_INSTANCE_NAME --user=postgres
# Then run SQL migrations manually
```

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Go to Vercel**: https://vercel.com/
2. **Import GitHub Repository**:
   - Click "New Project"
   - Import your repository
3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variable**:
   - Key: `VITE_API_BASE_URL`
   - Value: Your Cloud Run URL + `/api` (e.g., `https://grabamovie-backend-xxx.run.app/api`)
5. **Deploy**: Click "Deploy"

### Step 5: Update CORS (2 minutes)

1. **Get your Vercel URL**: e.g., `https://your-app.vercel.app`
2. **Update Backend CORS**:
   - Go to Cloud Run → Edit & Deploy New Revision
   - Add environment variable:
     - Key: `ALLOWED_ORIGINS`
     - Value: `https://your-app.vercel.app`
   - Deploy

### Step 6: Verify Deployment (5 minutes)

1. **Test Backend**: Visit `https://your-backend-url/api/movies`
2. **Test Frontend**: Visit your Vercel URL
3. **Test Features**:
   - User registration/login
   - Browse movies
   - Add to favorites
   - Take a quiz

## 📋 Required Credentials

Before deploying, make sure you have:

- [ ] Google Cloud account with billing enabled
- [ ] Cloudinary account and URL
- [ ] TMDB API key (optional)
- [ ] Strong JWT secret (generate random string)
- [ ] Database password

## 🔗 Useful Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudinary Dashboard**: https://cloudinary.com/console
- **TMDB API**: https://www.themoviedb.org/settings/api

## 💰 Cost Estimate

- **Google Cloud SQL**: ~$7-25/month
- **Cloud Run**: Free tier (2M requests/month)
- **Vercel**: Free tier (unlimited deployments)
- **Total**: ~$7-25/month

## 🆘 Troubleshooting

**Database Connection Issues?**
- Verify DATABASE_URL format
- Check Cloud SQL instance is running
- Ensure Cloud SQL connection is added to Cloud Run

**CORS Errors?**
- Add Vercel URL to ALLOWED_ORIGINS
- Redeploy backend after CORS changes

**Build Failures?**
- Check Node.js version (20.x)
- Verify all dependencies in package.json
- Check build logs in Cloud Console/Vercel

## 📞 Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

