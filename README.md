# HotDrop

[![npm version](https://img.shields.io/npm/v/hotdrop)](https://www.npmjs.com/package/hotdrop)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)

> Serverless P2P file sharing — no cloud, no installs, just a URL.

Files transfer **directly between browsers** via WebRTC. The server only brokers the initial handshake — it never sees your files. Supports multiple peers per room, works across any network, and runs offline on a local LAN with zero internet usage.

**[Try it live](https://hotdrop.armedjuror.in)** · [npm](https://www.npmjs.com/package/hotdrop) · [Buy me a coffee](https://buymeacoffee.com/armedjuror)

---

## Table of Contents

- [How it works](#how-it-works)
- [Installation](#installation)
  - [Global CLI (local network)](#global-cli-local-network)
  - [Self-hosted server](#self-hosted-server)
- [CLI reference](#cli-reference)
- [Architecture](#architecture)
- [Features](#features)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

---

## How it works

1. Open the app → tap **Create Room** → share the 6-character code or QR
2. Other devices scan the QR or enter the code
3. A direct WebRTC connection is established between all peers
4. Any peer can send files — recipients get an instant in-browser download prompt

Files exist only in browser memory. Nothing is written to disk or stored on the server.

---

## Installation

### Global CLI (local network)

Install globally via npm to run HotDrop as a background service on your machine. All traffic stays on your LAN — zero internet data consumed.

```bash
npm install -g hotdrop
hotdrop start
```

Or install from source:

```bash
git clone https://github.com/armedjuror/hotdrop
cd hotdrop
bash local_install.sh
```

Once running, open `http://<YOUR_LOCAL_IP>:5821` on any device on the same network. The QR code on the create screen automatically encodes the server's LAN IP so other devices can scan and join immediately.

The UI shows a **HotDrop.local** label when connected to a local server.

### Self-hosted server

To run HotDrop on a VPS or cloud server (accessible over the internet):

```bash
git clone https://github.com/armedjuror/hotdrop
cd hotdrop
npm install
npm start
```

Set the `PORT` environment variable if needed (defaults to `5821`). For production, place it behind a reverse proxy (nginx, Caddy) with TLS — the client requires `wss://` on HTTPS origins.

---

## CLI reference

```
hotdrop start      Start the server in the background (survives terminal close)
hotdrop stop       Stop the server
hotdrop status     Check whether the server is running
hotdrop logs       View server logs
hotdrop uninstall  Stop the server and remove temp files
```

---

## Architecture

```
Browser A ──── WebRTC DataChannel (direct P2P) ──── Browser B
    │                                                     │
    │                                               Browser C
    │                                                     │
    └────────── WebSocket (signaling only) ───────────────┘
                       Signaling server
                  (never sees your files)
```

The signaling server exchanges only WebRTC handshake messages (offer/answer/ICE candidates). Once peers are connected, the server plays no further role.

Each pair of peers maintains its own direct P2P connection (mesh topology). Sending a file broadcasts it to all connected peers simultaneously — each peer receives a full independent copy.

---

## Features

- No client installs — works in any modern browser
- Pure P2P — files never touch the server
- Multi-peer rooms — send to multiple devices at once
- Room grace period — rooms stay alive for 5 minutes after the last peer disconnects, allowing rejoin without recreating
- LAN mode — run locally for zero-internet intra-network transfers
- QR code auto-encodes the server's LAN IP when running locally
- Installable as a PWA on iOS, Android, and desktop
- Single-file frontend — no build step, no bundler

---

## Limitations

- All peers must have the page open simultaneously (no store-and-forward)
- Multi-peer upload cost: a 1 GB file sent to 3 peers uses 2 GB of upload
- Large files (>1 GB) may be constrained by device RAM
- No TURN relay — if NAT traversal fails, there is no fallback
- WebRTC on iOS requires Safari 16+ or any browser on iOS 16+

---

## Contributing

Contributions are welcome. Please open an issue first for significant changes so the approach can be discussed before a PR is submitted.

**Guidelines:**

- Keep the server minimal — `express` and `ws` are the only dependencies by design
- The frontend is a single `index.html` with no build step — keep it that way
- Test on at least two real devices (not just two browser tabs) before submitting
- Follow existing code style — no linters are enforced, but consistency matters

**Development setup:**

```bash
git clone https://github.com/armedjuror/hotdrop
cd hotdrop
npm install
npm start
# Open http://localhost:5821 in two tabs or on two devices on the same network
```

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Open a pull request against `main`

---

## License

[MIT](LICENSE)
