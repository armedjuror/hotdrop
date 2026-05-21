# HotDrop 🔥

> P2P file sharing between any devices — no cloud, no cables, no installs. Just open a URL.

Files transfer **directly between browsers** via WebRTC. Nothing touches the server. Supports multiple peers in the same room, and rooms stay alive for 5 minutes after the last peer disconnects so anyone can rejoin.

---

## How it works

1. Open the app → tap **Create Room** → get a 6-digit code + QR
2. Other devices scan the QR or tap **Join with Code**
3. WebRTC connection established directly between browsers
4. Any device can send files — they download instantly on the other side

Files live in RAM only. Nothing is stored on the server.

---

## Deployment

### Self-hosted server (VPS / cloud)

The `signaling/` folder contains the full server — it serves the frontend and handles WebSocket signaling.

```bash
git clone https://github.com/armedjuror/hotdrop
cd hotdrop/signaling
npm install
node server.js
```

Set a `PORT` environment variable if needed (defaults to `5821`).

For production, run it behind a reverse proxy (nginx/caddy) with TLS so the client can use `wss://`.

### Local network install

For intra-network transfers — zero internet, files never leave your LAN.

```bash
git clone https://github.com/armedjuror/hotdrop
cd hotdrop
bash local_install.sh
```

This installs the `hotdrop` command globally. Then:

```bash
hotdrop start     # starts server in background (survives terminal close)
hotdrop stop      # stops the server
hotdrop status    # check if running
hotdrop logs      # view server logs
hotdrop uninstall # stop and clean up
```

Open `http://YOUR_LOCAL_IP:5821` on any device on the same network. The QR code on the create screen automatically encodes the server's LAN IP — just scan to join.

---

## Architecture

```
Browser A  ──── WebRTC DataChannel (direct P2P) ────  Browser B
    │                                                       │
    │                                                  Browser C
    │                                                       │
    └──────────── WebSocket (signaling only) ───────────────┘
                        Signaling server
                   (never sees your files)
```

The server only exchanges WebRTC handshake messages (offer/answer/ICE candidates). Once peers are connected, the server is out of the picture. Multiple peers can share the same room — each pair maintains a direct P2P connection.

---

## Features

- No installs — just a URL
- Works from any device with a browser
- Files never leave your devices — pure P2P
- Multi-peer rooms — send to multiple devices at once
- Rooms persist for 5 minutes after disconnect — rejoin without recreating
- QR code encodes LAN IP on local server for instant scanning
- Installable as a PWA on iPhone, Android, Mac
- `.local` branding when running on a local server

## Limitations

- All peers must have the browser open simultaneously
- Multi-peer sends one full copy per peer — a 1 GB file to 3 peers costs 2 GB upload
- Very large files (>1 GB) may be slow depending on device RAM
- No TURN relay — if direct P2P fails (rare), there is no fallback
- Safari on iOS: WebRTC works on Safari 16+

---

## Contributing

Contributions are welcome. A few guidelines:

- Keep it dependency-light — the server is intentionally minimal (express + ws only)
- No build step — the frontend is a single `index.html`, keep it that way
- Test on at least two real devices before submitting a PR
- Open an issue first for large changes so we can discuss the approach

```bash
# Run locally for dev
cd hotdrop/signaling
npm install
node server.js
# Open http://localhost:5821 in two tabs or two devices on the same network
```

---

## License

MIT
