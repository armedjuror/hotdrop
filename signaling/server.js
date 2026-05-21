const { WebSocketServer } = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const os = require('os');

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

const PORT = process.env.PORT || 5821;

const app = express();

// Serve the PWA frontend from ../public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/status', (req, res) => {
  res.json({ status: 'hotdrop online', rooms: rooms.size });
});

// Local IP — used by the client to generate a scannable QR when running on localhost
app.get('/api/local-ip', (req, res) => {
  res.json({ ip: getLocalIP() });
});

// Fallback to index.html for any unmatched route (PWA deep links)
app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// rooms: Map<roomCode, { peers: Set<ws>, timer: ReturnType<typeof setTimeout> | null }>
const rooms = new Map();
const ROOM_TTL = 5 * 60 * 1000; // 5-minute grace period after last peer leaves

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcast(roomCode, data, exclude = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const peer of room.peers) {
    if (peer !== exclude) send(peer, data);
  }
}

wss.on('connection', ws => {
  ws.room = null;
  ws.peerId = Math.random().toString(36).slice(2, 10);

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'create': {
        let code = generateCode();
        while (rooms.has(code)) code = generateCode();
        rooms.set(code, { peers: new Set([ws]), timer: null });
        ws.room = code;
        send(ws, { type: 'created', code, peerId: ws.peerId });
        console.log(`Room created: ${code}`);
        break;
      }

      case 'join': {
        const code = (msg.code || '').toUpperCase().trim();
        if (!rooms.has(code)) {
          send(ws, { type: 'error', message: 'Room not found' });
          return;
        }
        const room = rooms.get(code);
        // Cancel expiry timer if the room was in grace period
        if (room.timer) {
          clearTimeout(room.timer);
          room.timer = null;
        }
        const existingPeerIds = [...room.peers].map(p => p.peerId);
        room.peers.add(ws);
        ws.room = code;
        send(ws, { type: 'joined', code, peerId: ws.peerId, peers: existingPeerIds });
        broadcast(code, { type: 'peer_joined', peerId: ws.peerId }, ws);
        console.log(`Peer joined room: ${code} (${room.peers.size} peers)`);
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice': {
        if (!ws.room) return;
        const room = rooms.get(ws.room);
        if (!room) return;
        const payload = { ...msg, from: ws.peerId };
        if (msg.to) {
          // Route to specific peer
          for (const peer of room.peers) {
            if (peer.peerId === msg.to) { send(peer, payload); break; }
          }
        } else {
          broadcast(ws.room, payload, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.room || !rooms.has(ws.room)) return;
    const room = rooms.get(ws.room);
    room.peers.delete(ws);
    broadcast(ws.room, { type: 'peer_left', peerId: ws.peerId });
    if (room.peers.size === 0) {
      const code = ws.room;
      room.timer = setTimeout(() => {
        rooms.delete(code);
        console.log(`Room expired: ${code}`);
      }, ROOM_TTL);
      console.log(`Room empty, expires in ${ROOM_TTL / 1000}s: ${ws.room}`);
    }
  });

  ws.on('error', () => {});
});

httpServer.listen(PORT, () => {
  const ip = getLocalIP();
  const url = ip ? `http://${ip}:${PORT}` : `http://localhost:${PORT}`;
  // OSC 8 hyperlink — clickable in iTerm2, modern Terminal.app, VS Code terminal, etc.
  const link = `\x1b]8;;${url}\x07${url}\x1b]8;;\x07`;
  console.log(`\n  HotDrop is running\n`);
  console.log(`  \x1b[36m${link}\x1b[0m\n`);
});