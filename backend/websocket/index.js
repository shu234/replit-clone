
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8081 });
console.log('WebSocket Server on ws://localhost:8081 - Live sync, Terminal, Presence & CRDT');
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      // broadcast to others
      wss.clients.forEach(c => { if(c!==ws && c.readyState===1) c.send(JSON.stringify(data)); });
      if(data.type==='TERMINAL_INPUT'){
        ws.send(JSON.stringify({type:'TERMINAL_OUTPUT', data: data.data}));
      }
    } catch {}
  });
});
