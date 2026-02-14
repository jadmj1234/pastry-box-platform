# Deploying אמא במשרד (Pastry Box Platform)

This app stores orders and file uploads on the **server filesystem** (`data/orders.json`, `data/uploads/`). Use a host that keeps a **persistent disk** so data is not lost on restart.

---

## Option 1: Railway (easiest, recommended)

1. **Push your code to GitHub**
   - Create a repo, push this project.

2. **Sign up at [railway.app](https://railway.app)** and create a new project.

3. **Deploy from GitHub**
   - “New Project” → “Deploy from GitHub repo” → select your repo.
   - Railway will detect Next.js and build/run it.

4. **Persist orders and uploads**
   - In your Railway service: **Variables** → add nothing required for basic run.
   - **Settings** → add a **Volume**: mount path `/app/data` (so the app’s `data/` folder lives on the volume).
   - Or: in **Settings** → **Root Directory** leave blank; ensure the start command is `npm run build && npm start`. Then add a volume mounted at `data` inside the project root (Railway’s UI may show “Persistent volume” – mount it so that `process.cwd()/data` is that volume).

   **Simpler approach:** Use Railway’s “Persistent Volume” and set the mount path to the folder that contains `orders.json` and `uploads`. For Next.js on Railway, the working directory is usually the project root, so mounting a volume at `/app/data` (if the app runs from `/app`) will make `data/orders.json` and `data/uploads/` persistent.

5. **Get your URL**
   - **Settings** → **Generate Domain**. You get a URL like `https://your-app.up.railway.app`.

6. **Share with the customer**
   - Customer site: `https://your-app.up.railway.app`
   - Manager: `https://your-app.up.railway.app/manager` (password: the one in your code, e.g. in `src/lib/auth.ts`).

7. **(Optional) Custom domain**
   - In Railway: **Settings** → **Domains** → add your domain and set the CNAME they give you at your DNS provider.

---

## Option 2: Render

1. Push the project to GitHub.

2. Go to [render.com](https://render.com) → **New** → **Web Service**, connect the repo.

3. **Build:** `npm install && npm run build`  
   **Start:** `npm start`

4. **Persistent disk (required for orders/uploads)**  
   - On the **Free** plan, the filesystem is **ephemeral** (data is lost on restart).  
   - Add a **Disk** (paid) and mount it so the app’s `data` directory is on that disk (e.g. mount at `data` in the project root). Without this, orders and uploads will not persist.

5. Use the generated URL (e.g. `https://your-app.onrender.com`) for customers and manager.

---

## Option 3: Your own server (VPS)

Good if you have a Linux server (DigitalOcean, Linode, etc.).

1. **On the server (Ubuntu example):**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm git
   git clone https://github.com/YOUR_USERNAME/pastry-box-platform.git
   cd pastry-box-platform
   npm install
   npm run build
   ```

2. **Run with PM2 (keeps it running):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "pastry-box" -- start
   pm2 save && pm2 startup
   ```

3. **Reverse proxy (e.g. Nginx) for HTTPS and domain:**
   - Point a domain (e.g. `pastry.yourdomain.com`) to the server IP.
   - Configure Nginx to proxy to `http://localhost:3000` and add SSL (e.g. Let’s Encrypt with `certbot`).

4. **Data:** `data/orders.json` and `data/uploads/` are on the server disk and persist across restarts.

---

## After deployment – checklist

- [ ] **Manager password** – Change the default in `src/lib/auth.ts` (or use env var if you add that) and redeploy.
- [ ] **Test** – Place a test order from the public URL; log in to `/manager` and confirm you see it and can export Excel.
- [ ] **HTTPS** – All options above support HTTPS (Railway/Render by default; on VPS use Nginx + Let’s Encrypt).
- [ ] **Backups** – For Railway/Render/VPS, back up `data/orders.json` and `data/uploads/` regularly (e.g. cron + copy to S3 or another server).

---

## If you later want Vercel (serverless)

Vercel does **not** keep a writable filesystem between requests. To use it you would:

- Store orders in a **database** (e.g. Vercel Postgres, Supabase, PlanetScale).
- Store uploaded files in **blob storage** (e.g. Vercel Blob, S3).

That requires code changes (API routes and libs using DB + blob instead of `data/`). The options above work with the **current** file-based code.
