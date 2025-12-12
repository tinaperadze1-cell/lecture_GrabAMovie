# Deployment Guide

This guide will help you deploy the GRABAMOVIE application to:
- **Backend**: Google Cloud Platform (Cloud Run or App Engine)
- **Frontend**: Vercel
- **Database**: Google Cloud SQL (PostgreSQL)

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Vercel Account** (free tier available)
3. **GitHub Account** (for repository)
4. **Cloudinary Account** (for image/video uploads)
5. **TMDB API Key** (optional, for "Soon to be Released" feature)

---

## Step 1: Set Up Google Cloud SQL Database

### 1.1 Create PostgreSQL Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **SQL** → **Create Instance**
3. Choose **PostgreSQL**
4. Configure:
   - **Instance ID**: `grabamovie-db` (or your preferred name)
   - **Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Database Version**: PostgreSQL 15 or 16
   - **Machine Type**: `db-f1-micro` (for development) or `db-g1-small` (for production)
5. Click **Create**

### 1.2 Create Database

1. Once instance is created, click on it
2. Go to **Databases** tab
3. Click **Create Database**
4. Name: `grabamovie` (or your preferred name)
5. Click **Create**

### 1.3 Get Connection String

1. Go to **Overview** tab
2. Find **Connection name** (format: `project:region:instance`)
3. Note this for later

### 1.4 Set Up Database Schema

**Option A: Using Cloud SQL Proxy (Recommended for local setup)**

1. Install Cloud SQL Proxy:
   ```bash
   # Windows (PowerShell)
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/cloudsql/cloud_sql_proxy_x64.exe", "$env:USERPROFILE\cloud_sql_proxy.exe")
   
   # Mac/Linux
   curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
   chmod +x cloud_sql_proxy
   ```

2. Start proxy:
   ```bash
   ./cloud_sql_proxy -instances=YOUR_CONNECTION_NAME=tcp:5432
   ```

3. Run migrations:
   ```bash
   cd backend
   npm run init-db
   ```

**Option B: Using Cloud Shell**

1. Open Cloud Shell in Google Cloud Console
2. Connect to your database:
   ```bash
   gcloud sql connect YOUR_INSTANCE_NAME --user=postgres
   ```
3. Create database and run SQL migrations manually

---

## Step 2: Deploy Backend to Google Cloud

### Option A: Deploy to Cloud Run (Recommended)

1. **Install Google Cloud SDK**:
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Build and Deploy**:
   ```bash
   cd backend
   
   # Build container image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/grabamovie-backend
   
   # Deploy to Cloud Run
   gcloud run deploy grabamovie-backend \
     --image gcr.io/YOUR_PROJECT_ID/grabamovie-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="postgresql://user:password@/dbname?host=/cloudsql/YOUR_CONNECTION_NAME" \
     --set-env-vars NODE_ENV="production" \
     --set-env-vars PORT="8080" \
     --set-env-vars CLOUDINARY_URL="your_cloudinary_url" \
     --set-env-vars TMDB_API_KEY="your_tmdb_key" \
     --set-env-vars JWT_SECRET="your_jwt_secret" \
     --add-cloudsql-instances YOUR_CONNECTION_NAME
   ```

4. **Note the Service URL** (e.g., `https://grabamovie-backend-xxx.run.app`)

### Option B: Deploy to App Engine

1. **Update app.yaml** with your project settings

2. **Deploy**:
   ```bash
   cd backend
   gcloud app deploy
   ```

3. **Set Environment Variables**:
   ```bash
   gcloud app deploy --set-env-vars DATABASE_URL="your_db_url",NODE_ENV="production",CLOUDINARY_URL="your_cloudinary_url"
   ```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Environment Variables

1. Go to your Vercel dashboard
2. Create a new project
3. Import your GitHub repository

### 3.2 Configure Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Set Environment Variables

In Vercel project settings, add:

- **Key**: `VITE_API_BASE_URL`
- **Value**: Your Google Cloud backend URL (from Step 2)
  - Cloud Run: `https://your-service.run.app/api`
  - App Engine: `https://your-project.appspot.com/api`

### 3.4 Deploy

1. Click **Deploy**
2. Vercel will automatically deploy on every push to your main branch

---

## Step 4: Configure CORS

Update your backend `server.js` CORS configuration to include your Vercel domain:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-app.vercel.app", // Add your Vercel URL
    ],
    credentials: true,
  })
);
```

---

## Step 5: Run Database Migrations

After deployment, run migrations to set up your database schema:

1. **Connect to Cloud SQL**:
   ```bash
   gcloud sql connect YOUR_INSTANCE_NAME --user=postgres
   ```

2. **Or use Cloud SQL Proxy** (see Step 1.4)

3. **Run migrations**:
   ```bash
   cd backend
   npm run init-db
   ```

---

## Step 6: Set Up Environment Variables

### Backend (Google Cloud)

Set these in Cloud Run/App Engine:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: `production`
- `PORT`: `8080` (Cloud Run) or auto (App Engine)
- `CLOUDINARY_URL`: Your Cloudinary URL
- `TMDB_API_KEY`: Your TMDB API key (optional)
- `JWT_SECRET`: A secure random string
- `DATABASE_SSL`: `true`

### Frontend (Vercel)

Set in Vercel project settings:

- `VITE_API_BASE_URL`: Your backend URL

---

## Step 7: Verify Deployment

1. **Backend Health Check**:
   - Visit: `https://your-backend-url/api/movies`
   - Should return JSON data

2. **Frontend**:
   - Visit your Vercel URL
   - Should load the application
   - Test API calls work

---

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check Cloud SQL instance is running
- Verify firewall rules allow connections
- For Cloud Run, ensure Cloud SQL connection is configured

### CORS Errors

- Add your Vercel domain to CORS origins in `server.js`
- Redeploy backend after CORS changes

### Environment Variables Not Working

- Restart Cloud Run service after setting env vars
- Rebuild Vercel deployment after adding env vars
- Verify variable names match exactly

### Build Failures

- Check Node.js version matches (20.x)
- Verify all dependencies are in `package.json`
- Check build logs in Google Cloud Console / Vercel

---

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] CORS configured for Vercel domain
- [ ] Backend health check passes
- [ ] Frontend loads and connects to backend
- [ ] Test user registration/login
- [ ] Test movie browsing
- [ ] Test admin panel (if applicable)
- [ ] Monitor logs for errors

---

## Cost Estimation

### Google Cloud (Free Tier Available)

- **Cloud SQL**: ~$7-25/month (db-f1-micro to db-g1-small)
- **Cloud Run**: Free tier: 2 million requests/month
- **App Engine**: Free tier: 28 instance-hours/day

### Vercel

- **Free Tier**: Unlimited deployments, 100GB bandwidth

### Total Estimated Cost

- **Development**: $0-10/month (using free tiers)
- **Production**: $10-50/month (depending on traffic)

---

## Support

For issues:
1. Check Google Cloud Console logs
2. Check Vercel deployment logs
3. Review this deployment guide
4. Check GitHub issues

---

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic with Vercel/Cloud Run)
3. Set up monitoring and alerts
4. Configure backup strategy for database
5. Set up CI/CD pipeline

