# Deployment Instructions for Calorie Tracker

## Prerequisites
- GitHub account
- Render account (or Railway/Heroku)
- Your environment variables ready

---

## Option 1: Deploy to Render (Recommended - Free Tier Available)

### Step 1: Prepare Your Repository

1. **Initialize Git (if not already done):**
   ```bash
   cd /Users/yashsheth/Desktop/Calorie-Tracker
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Name it `calorie-tracker`
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/calorie-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Render

1. **Go to Render:**
   - Visit https://render.com
   - Sign up or log in (can use GitHub)

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `calorie-tracker` repository

3. **Configure the Service:**
   - **Name:** `calorie-tracker` (or your choice)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these three variables (use values from your local `.env` file):
   ```
   OPENAI_API_KEY=<your-openai-api-key>
   
   SUPABASE_URL=<your-supabase-project-url>
   
   SUPABASE_SECRET_KEY=<your-supabase-secret-key>
   ```
   
   **Note:** Copy these values from your local `.env` file. Never commit actual API keys to GitHub!

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (2-5 minutes)
   - Your app will be live at: `https://calorie-tracker-xxxx.onrender.com`

---

## Option 2: Deploy to Railway (Alternative)

1. **Go to Railway:**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `calorie-tracker` repository

3. **Add Environment Variables:**
   - Go to "Variables" tab
   - Add these variables (use values from your local `.env` file):
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `SUPABASE_URL` - Your Supabase project URL
     - `SUPABASE_SECRET_KEY` - Your Supabase secret key

4. **Deploy:**
   - Railway will auto-detect Node.js and deploy
   - Your app will be live at: `https://your-app.up.railway.app`

---

## Option 3: Deploy to Vercel (For Node.js apps)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /Users/yashsheth/Desktop/Calorie-Tracker
   vercel
   ```

3. **Add Environment Variables:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add all three env variables from your local `.env` file:
     - `OPENAI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SECRET_KEY`

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## Post-Deployment Steps

### 1. Test Your Deployed App
- Visit your deployed URL
- Try registering a new user
- Log a meal and verify it saves to database
- Check if the 7-day chart loads

### 2. Update Supabase Settings (If needed)
- Go to Supabase dashboard
- Project Settings → API
- Add your deployment URL to "Allowed Origins" if you get CORS errors

### 3. Monitor Your App
- Check Render/Railway logs for any errors
- Monitor API usage on OpenAI dashboard
- Check Supabase usage

---

## Troubleshooting

### App won't start
- Check environment variables are set correctly
- Check logs in Render/Railway dashboard
- Verify `npm start` works locally first

### Database connection fails
- Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct
- Check Supabase project is active
- Verify Output and Users tables exist

### OpenAI API fails
- Verify `OPENAI_API_KEY` is valid
- Check you have credits in OpenAI account
- Monitor rate limits

---

## Free Tier Limitations

### Render Free Tier:
- Apps spin down after 15 minutes of inactivity
- 750 hours/month
- Slower performance than paid tiers

### Railway Free Tier:
- $5 free credit per month
- Sleeps after inactivity

### Recommendation:
Start with Render's free tier. If your app needs to be always-on, consider upgrading or using Railway.

---

## Updating Your Deployed App

After making code changes:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render/Railway will automatically redeploy!

---

## Custom Domain (Optional)

Once deployed, you can add a custom domain:

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In Render/Railway, go to Settings → Custom Domain
3. Add your domain
4. Update DNS records as instructed

---

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

