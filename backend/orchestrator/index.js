import express from 'express'; import cors from 'cors'; import { exec } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url)); const app = express(); app.use(cors()); app.use(express.json({limit:'10mb'}));
app.get('/', (req,res)=> res.json({status:'orchestrator ok - base64 fix'}));
app.post('/api/sandbox/create', (req,res)=> res.json({sandboxId: req.body?.projectId||'demo'}));
app.post('/api/execute', (req,res)=>{
  const code = req.body.code || 'console.log("hi")';
  const b64 = Buffer.from(code).toString('base64');
  const cmd = `echo ${b64} | base64 -d | docker run --rm -i node:20-alpine sh -c 'cat > /tmp/index.js; node /tmp/index.js' 2>&1`;
  exec(cmd, {timeout:15000, maxBuffer:1024*1024}, (err, stdout)=>{
    if (err && !stdout) stdout = err.message;
    res.json({stdout, mode:'docker-sandbox'});
  });
});
app.post('/api/deploy', (req,res)=> res.json({url:`https://${req.body.projectId||'app'}.workers.dev`, status:'deployed'}));
app.listen(3001, ()=>console.log('Orchestrator FIXED on 3001'));
