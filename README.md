# Premium Self-Hosted Music Hub 🎵

A premium, self-hosted web application for progressive metal and ambient music exploration, personal rating logs, multi-user scoring, and annual finalists archiving. It features a modern **"liquid glass"** (glassmorphic / Apple-inspired) aesthetic, deep data analytics, and a procedural scraping/generation engine.

---

## ⚡ Tech Stack & Architecture

- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons + Framer Motion (premium animations).
- **Backend:** Node.js + Express API + Asynchronous SQLite client wrapper.
- **Database:** SQLite (`music_hub.db` file) with foreign key cascading.
- **Deployment:** Dockerized multi-stage setup with persistent storage volume bindings.

---

## 🎨 Visual System ("Liquid Glass")

- **Floating Orbs:** Shifting radial gradients floating behind the main content panels create depth and smooth movement.
- **Glass Panels:** High backdrop blur (`backdrop-blur-xl`) with fine borders (`border-white/10`) and slight translucency.
- **Micro-interactions:** Interactive elements feature smooth spring-based hover scales, color glows, and fade transitions.
- **Vibe Themes:** Profile screens dynamically adapt their ambient glow depending on the band (e.g. emerald thall for *Vildhjarta*, ice-blue for *Karmanjakah*, warm orange for *Meshuggah*).

---

## ⚙️ Features

1. **Global Judges Panel:** Settings screen allowing dynamic addition/removal of judges. Updates scoring displays and user analytics across the entire database seamlessly.
2. **Metadata Scraping & Procedural Generator:** Adding an artist triggers a service that grabs authentic discographies for known acts (e.g. *Meshuggah*, *Periphery*, *TesseracT*, *Sleep Token*) or procedurally generates realistic biographies, lineup members, albums, single tracks, durations, and abstract album art keywords for unknown bands.
3. **Expandable Lyrics & Multi-User Sliders:** Every track displays its duration and average score. Click a track to expand it inline, revealing scrolling lyrics and custom 0-10 sliders for each registered judge.
4. **User Insights & Stats:** Choose a judge to compile their highest-rated album (LP track ratings average) and highest-rated songs.
5. **Artist Tier List:** Categorizes bands into S, A, B, C, D, F tiers dynamically based on catalog rating averages.
6. **2K Awards Hub:** Nominate candidates for the "2K Song of the Year" for any calendar year, view historical winners, and crown winners (with celebratory confetti).

---

## 🚀 Running the Application (Docker)

To build and spin up the container in a single command, run the following in your shell:

```bash
docker compose up -d --build
```

### Accessing the Hub & Exposing to Portable Devices

#### 1. Local Access (Desktop)
- The server runs on: **`http://localhost:3000`**

#### 2. Mobile Access (Smartphones & Tablets on local Wi-Fi)
- Make sure your mobile device is connected to the **same Wi-Fi network** as your host computer.
- Find your computer's local network IP address (e.g. `192.168.1.15`).
  - On Windows: Run `ipconfig` in Command Prompt / PowerShell.
  - On macOS/Linux: Run `ifconfig` or `ip a`.
- On your phone, open: **`http://<your-computer-ip>:3000`**

#### 3. Remote/Global Access (From Everywhere)
Because the app uses a dynamic Node.js backend and an active SQLite database, it **cannot** be hosted directly on static platforms like **GitHub Pages** (which only support static HTML/CSS/JS files).
To access your local instance from anywhere on the internet for free, use a secure tunneling utility:

##### Option A: Localtunnel (Easiest)
1. Run localtunnel pointing to the local port:
   ```bash
   npx localtunnel --port 3000
   ```
2. Open the generated public HTTPS URL on your phone or share it.

##### Option B: Ngrok
1. Install ngrok and run:
   ```bash
   ngrok http 3000
   ```
2. Open the generated public URL.

### Persistent Storage
- All database state survives container teardowns and resets. The SQLite file is saved under `./data/music_hub.db` on your host machine, bound directly inside the container volume.
