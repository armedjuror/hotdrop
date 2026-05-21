const { WebSocketServer } = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 8080;

const app = express();

// Serve the PWA frontend from ../public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/status', (req, res) => {
  res.json({ status: 'hotdrop online', rooms: rooms.size });
});

// Fallback to index.html for any unmatched route (PWA deep links)
app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// rooms: Map<roomCode, Set<ws>>
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcast(room, data, exclude = null) {
  if (!rooms.has(room)) return;
  for (const peer of rooms.get(room)) {
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
        rooms.set(code, new Set([ws]));
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
        if (room.size >= 2) {
          send(ws, { type: 'error', message: 'Room is full' });
          return;
        }
        room.add(ws);
        ws.room = code;
        send(ws, { type: 'joined', code, peerId: ws.peerId });
        broadcast(code, { type: 'peer_joined', peerId: ws.peerId }, ws);
        console.log(`Peer joined room: ${code}`);
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice': {
        if (!ws.room) return;
        broadcast(ws.room, { ...msg, from: ws.peerId }, ws);
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.room || !rooms.has(ws.room)) return;
    const room = rooms.get(ws.room);
    room.delete(ws);
    broadcast(ws.room, { type: 'peer_left' });
    if (room.size === 0) {
      rooms.delete(ws.room);
      console.log(`Room closed: ${ws.room}`);
    }
  });

  ws.on('error', () => {});
});

httpServer.listen(PORT, () => {
  console.log(`hotdrop running on port ${PORT}`);
});
