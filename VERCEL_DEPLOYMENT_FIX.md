# Fix Vercel Deployment Issue

## Problem
Vercel says: "To deploy to production, push to the Repository Default branch"

## Solution Options

### Option 1: Configure Vercel to Use Master Branch (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project** (lecture_GrabAMovie)
3. **Click "Settings"** (gear icon in top right)
4. **Go to "Git"** section (left sidebar)
5. **Find "Production Branch"** setting
6. **Change it from `main` to `master`**
7. **Click "Save"**
8. **Go back to "Deployments"** tab
9. **Click "Redeploy"** on the latest deployment, or make a new commit to trigger deployment

### Option 2: Rename Branch to Main (Alternative)

If you prefer to use `main` as the default branch:

1. **Rename local branch**:
   ```bash
   git branch -m master main
   ```

2. **Push to new branch**:
   ```bash
   git push -u origin main
   ```

3. **Set main as default on GitHub**:
   - Go to: https://github.com/tinaperadze1-cell/lecture_GrabAMovie/settings
   - Click "Branches" in left sidebar
   - Under "Default branch", click the switch icon
   - Select `main`
   - Click "Update"
   - Confirm the change

4. **Delete old master branch** (optional):
   ```bash
   git push origin --delete master
   ```

5. **Update Vercel**:
   - Go to Vercel project settings
   - Change Production Branch to `main`
   - Save

### Option 3: Manual Deployment (Quick Fix)

1. **Go to Vercel Dashboard**
2. **Click on your project**
3. **Click "Deployments"** tab
4. **Click "..." (three dots)** on any deployment
5. **Click "Redeploy"**
6. **Or click "Create Deployment"** button
7. **Select branch**: `master`
8. **Click "Deploy"**

## Verify Everything is Pushed

Make sure all your code is pushed to GitHub:

```bash
# Check status
git status

# If there are uncommitted changes:
git add .
git commit -m "Prepare for deployment"
git push origin master
```

## After Fixing

1. **Wait 1-2 minutes** for Vercel to detect the change
2. **Check Deployments tab** - you should see a new deployment starting
3. **Once deployed**, your site will be live!

## Still Having Issues?

1. **Disconnect and reconnect** the repository in Vercel:
   - Settings → Git → Disconnect
   - Add New Project → Import again
   - Make sure to select `master` as production branch

2. **Check GitHub repository settings**:
   - Make sure repository is public (or Vercel has access)
   - Verify default branch is set correctly

