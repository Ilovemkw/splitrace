// Servidor central: recibe datos de los agentes y los retransmite a los dashboards.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const STALE_MS = 5000;
const rooms = new Map(); // room -> Map(name -> {state, lastSeen})
const viewers = new Map(); // ws -> room

const server = http.createServer((req, res) => {
  const page = req.url.startsWith('/play') ? 'play.html' : 'index.html';
  const file = path.join(__dirname, 'public', page);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocketServer({ server });

function snapshot(room) {
  const players = rooms.get(room) || new Map();
  const now = Date.now();
  const list = [...players.entries()].map(([name, p]) => ({
    name,
    ...p.state,
    connected: now - p.lastSeen < STALE_MS,
  }));
  // Orden: terminados (por tiempo final) > mayor split > menor tiempo del último split
  list.sort((a, b) => {
    const ae = a.phase === 'Ended', be = b.phase === 'Ended';
    if (ae !== be) return ae ? -1 : 1;
    if (ae && be) return (a.finalMs ?? Infinity) - (b.finalMs ?? Infinity);
    if (a.splitIndex !== b.splitIndex) return b.splitIndex - a.splitIndex;
    return (a.lastSplitMs ?? Infinity) - (b.lastSplitMs ?? Infinity);
  });
  return { type: 'snapshot', room, players: list, serverTime: now };
}

function broadcast(room) {
  const msg = JSON.stringify(snapshot(room));
  for (const [ws, r] of viewers) {
    if (r === room && ws.readyState === 1) ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.type === 'watch' && m.room) {
      viewers.set(ws, String(m.room));
      ws.send(JSON.stringify(snapshot(String(m.room))));
    } else if (m.type === 'update' && m.room && m.name) {
      const room = String(m.room);
      if (!rooms.has(room)) rooms.set(room, new Map());
      rooms.get(room).set(String(m.name), { state: m.state, lastSeen: Date.now() });
      broadcast(room);
    }
  });
  ws.on('close', () => viewers.delete(ws));
});

// Refresca para marcar jugadores desconectados
setInterval(() => { for (const room of rooms.keys()) broadcast(room); }, 2000);

server.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
