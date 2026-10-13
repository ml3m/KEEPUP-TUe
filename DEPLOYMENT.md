# KEEPUP — Cloud Deployment Guide

KEEPUP is now unified into a single production service: the Express backend serves both the REST API and the React frontend.

---

## Option A: Deploy to Render (Easiest & Free)

Render provides free hosting with native support for Node.js and persistent disks for SQLite.

### 1. Push your repository to GitHub
If you haven't already initialized git:
```bash
git init
git add .
git commit -m "Initial commit for KEEPUP planner"
# Create a repo on github.com, then:
git remote add origin https://github.com/<your-username>/keepup.git
git push -u origin main
```

### 2. Create the Web Service on Render
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in (e.g. with GitHub).
2. Click **New +** → **Web Service**.
3. Select your `keepup` GitHub repository.
4. Fill in the following fields:
   - **Name**: `keepup` (or any name you like)
   - **Region**: Frankfurt / Amsterdam (closest to TU/e)
   - **Runtime**: **Node**
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### 3. (Optional) Set Persistent Storage for SQLite
To keep your saved courses permanently across server restarts:
1. In the service settings, scroll to **Disks** → **Add Disk**.
2. **Name**: `keepup-data`
3. **Mount Path**: `/var/data`
4. **Size**: `1 GB`
5. Under **Environment Variables**, add:
   - `DB_PATH`: `/var/data/keepup.db`

### 4. (Optional) Protect with a Password
If you don't want anyone else editing your courses on the public internet, add this Environment Variable in Render:
- `APP_PASSWORD`: `your-chosen-password`

Your browser will automatically show a clean prompt asking for your password when visiting the site!

---

## Option B: Deploy with Fly.io (Fast & Free Tier)

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
2. Launch the app using the included Dockerfile:
   ```bash
   fly launch
   ```
3. Create a 1GB persistent volume for SQLite:
   ```bash
   fly volumes create keepup_data --size 1
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

## Option C: Run with Docker Compose on Any VPS

On any Linux server (DigitalOcean droplet, Hetzner VPS, Raspberry Pi, etc.):
```bash
docker compose up -d --build
```
Your app will be live at `http://<your-server-ip>:3001` with data safely persisted in a Docker volume.
