# HotDrop 🔥

> P2P file sharing between any two devices — no cloud, no cables, no installs. Just open a URL.

Files transfer **directly between browsers** via WebRTC. Nothing touches the server. Works across different networks, not just same Wi-Fi.

---

## How it works

1. Open the app on any device → tap **Create Room** → get a 6-digit code + QR
2. Other device scans the QR (or taps **Join with Code**)
3. WebRTC connection established directly between the two browsers
4. Either device can send files — they download instantly on the other side

Files live in RAM only. Nothing is stored on the server.

---

## Deploy to Railway (single service)

Everything runs from the `signaling/` folder — it serves the frontend AND handles WebSocket signaling.

**Steps:**

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set the **Root Directory** to `signaling/`
4. Railway auto-detects `npm start` and deploys

That's it. Your app is live at `https://your-app.railway.app`.

No env vars needed. No separate frontend deploy. The `PORT` is set automatically by Railway.

---

## Local dev

```bash
cd signaling
npm install
node server.js
# Open http://localhost:8080 in two tabs or two devices on same network
```

---

## Architecture

```
Browser A  ──────── WebRTC DataChannel (direct P2P) ────────  Browser B
    │                                                               │
    └──────────────── WebSocket (signaling only) ──────────────────┘
                           Railway server
                      (never sees your files)
```

The server only exchanges WebRTC handshake messages (offer/answer/ICE candidates). Once connected, it's out of the picture.

---

## Features

- 🔥 No installs — just a URL
- 📱 Works from any device with a browser
- 🔒 Files never leave your devices — pure P2P
- 📲 Installable as a PWA on iPhone, Android, Mac
- ⚡ Direct transfer — as fast as your network
- 🌐 Works across different networks
- 🔗 QR code for instant joining from phone
- 📦 Chunked transfer with progress bar

## Limitations

- Both devices must have the browser open simultaneously
- Very large files (>1GB) may be slow depending on device RAM
- Safari on iOS: WebRTC works on Safari 16+

---

## License

MIT
