# 🚀 Railway Deployment Guide

## ✅ What's Ready
- ✅ Local database with 190 users and test content
- ✅ Clean schema export: `database/railway_export.sql`
- ✅ Data-only export: `database/railway_data_only.sql` (1,160 lines)
- ✅ Railway deployment scripts
- ✅ Code pushed to GitHub

## 🎯 Step-by-Step Railway Deployment

### Step 1: Set Up Railway Database
1. Go to [Railway Dashboard](https://railway.app)
2. Select your odinbook project
3. Click **"New Service"** → **"Database"** → **"PostgreSQL"**
4. Wait for provisioning (2-3 minutes)

### Step 2: Get Railway DATABASE_URL
1. Click on your PostgreSQL service
2. Go to **"Variables" tab**
3. Copy the `DATABASE_URL` (looks like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`)

### Step 3: Set Environment Variables in Railway
1. Go to your **main application service** (not the database)
2. Go to **"Variables" tab**
3. Add these environment variables:

```
DATABASE_URL = postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
SESSION_SECRET = your-super-secret-session-key-change-this-in-production
GRAVATAR_API_KEY = 5255:gk-4XrdREV2jVhmF-wjvZv-WgMstXPhq7SJzqRhC0qLhXAt_XLpfgusztD5XYopE
CLOUDINARY_CLOUD_NAME = dn7jwefev
CLOUDINARY_API_KEY = 558971723947258
CLOUDINARY_API_SECRET = DOhi3kAmpsvJ2JOErEeI3TorTcA
```

### Step 4: Wait for Railway Deployment
- Railway will automatically deploy your app
- It will run `npx prisma migrate deploy` (from railway.toml)
- Database schema will be created

### Step 5: Import Your Test Content
Once Railway shows your app is deployed, run:

```bash
# Import schema and data
psql "your-railway-database-url" < database/railway_export.sql

# Or import just the data (if schema already exists)
psql "your-railway-database-url" < database/railway_data_only.sql
```

## 🔧 Available Commands

```bash
# Create fresh export of local database
npm run export:railway

# Create backup of local database
npm run backup:local

# Check local database status
npm run status
```

## 📊 Your Test Content
- **190 users** ready to import
- **Posts, comments, likes** included
- **Friend relationships** preserved
- **All test data** maintained

## 🎉 Success!
Once deployed, your Railway app will have all your test content and be fully functional!

## 🔄 Local Development
To continue local development:
```bash
# Your local .env is already set correctly
npm run dev
```

## 📝 Notes
- Railway internal URLs (`postgres.railway.internal`) only work from Railway's network
- External URLs (`containers-us-west-xxx.railway.app`) work from anywhere
- Your local database remains unchanged
- All test content is preserved in the exports
