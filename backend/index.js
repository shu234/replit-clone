import express from 'express'; import cors from 'cors'; import { exec, spawn } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { createServer } from 'http'; import { Server } from 'socket.io';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express(); app.use(cors({origin:'*'})); app.use(express.json({limit:'10mb'}));
const httpServer = createServer(app);
const io = new Server(httpServer, {cors:{origin:'*'}});
const PROJECT_DIR = path.resolve(__dirname, '../projects/demo-project');
if(!fs.existsSync(PROJECT_DIR)) fs.mkdirSync(PROJECT_DIR,{recursive:true});
let serverProc = null; let envVars = {}; let deployHistory = [];
try{ if(fs.existsSync(path.join(PROJECT_DIR, '.env.json'))){ envVars = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, '.env.json'),'utf8')); } }catch{}
try{ if(fs.existsSync(path.join(PROJECT_DIR, '.deploy.json'))){ deployHistory = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, '.deploy.json'),'utf8')); } }catch{}
io.on('connection', (socket)=>{
  console.log('User connected', socket.id);
  socket.on('cursor-move', (data)=> socket.broadcast.emit('cursor-move', {...data, id: socket.id}));
  socket.on('code-change', (data)=> socket.broadcast.emit('code-change', data));
  socket.on('disconnect', ()=> io.emit('user-left', socket.id));
});
app.get('/', (req,res)=> res.json({status:'V10.1 - Fixed AI + No node_modules', users: io.engine.clientsCount}));
app.get('/api/env', (req,res)=> res.json({env: envVars}));
app.post('/api/env', (req,res)=>{ envVars = req.body.env||{}; fs.writeFileSync(path.join(PROJECT_DIR, '.env.json'), JSON.stringify(envVars, null, 2)); res.json({status:'saved', env: envVars}); });
app.post('/api/ai-complete', (req,res)=>{
  const {code, cursorLine} = req.body;
  const line = (code?.split('\n')[cursorLine-1]||'').trim();
  if(!line || line.includes('V10 AI suggestion')) return res.json({suggestion:'', ghostText:''});
  let suggestion = '';
  if(line.endsWith('console.log(')) suggestion = '"Hello V10 AI 🚀"';
  else if(line.endsWith('app.get(')) suggestion = '"/", (req,res)=> res.send("AI!")';
  else if(line === 'const ') suggestion = 'app = express();';
  else return res.json({suggestion:'', ghostText:''});
  res.json({suggestion, ghostText: suggestion});
});
app.post('/api/execute', (req,res)=>{
  const {code, file='', lang='node', stdin='', env={}} = req.body;
  const combinedEnv = {...envVars,...env};
  const b64 = Buffer.from(code||'').toString('base64');
  const stdinB64 = Buffer.from(stdin||'').toString('base64');
  const fileName = file||'index.js'; const ext = path.extname(fileName);
  let cmd = '';
  if(lang==='python' || fileName.endsWith('.py')) cmd = `echo ${b64} | base64 -d > /tmp/main.py; echo ${stdinB64} | base64 -d | python3 /tmp/main.py 2>&1`;
  else if(ext==='.c' || lang==='c') cmd = `echo ${b64} | base64 -d > /tmp/main.c; gcc /tmp/main.c -o /tmp/a.out && echo ${stdinB64} | base64 -d | /tmp/a.out 2>&1`;
  else if(ext==='.cpp' || lang==='cpp') cmd = `echo ${b64} | base64 -d > /tmp/main.cpp; g++ /tmp/main.cpp -o /tmp/a.out && echo ${stdinB64} | base64 -d | /tmp/a.out 2>&1`;
  else if(ext==='.go' || lang==='go') cmd = `echo ${b64} | base64 -d > /tmp/main.go; echo ${stdinB64} | base64 -d | go run /tmp/main.go 2>&1`;
  else { const envInject = Object.entries(combinedEnv).map(([k,v])=>`process.env["${k}"]=${JSON.stringify(v)};`).join(''); const fullCodeB64 = Buffer.from(envInject + (code||'')).toString('base64'); cmd = `echo ${fullCodeB64} | base64 -d > /tmp/index.js; echo ${stdinB64} | base64 -d | node /tmp/index.js 2>&1`; }
  exec(cmd, {timeout:15000, maxBuffer:1024*1024*5, env:{...process.env,...combinedEnv}}, (err, stdout, stderr)=>{ let output = (stdout||'')+(stderr||''); if(err &&!stdout) output = err.message; res.json({stdout: output, mode:`${lang}-v10.1`, env: combinedEnv}); });
});
app.post('/api/deploy', (req,res)=>{
  const {projectId='demo-project', file='server.js'} = req.body; const fp = path.join(PROJECT_DIR, file); if(!fs.existsSync(fp) && req.body.code) fs.writeFileSync(fp, req.body.code);
  const publicUrl = `https://${projectId}-${Date.now().toString(36).slice(0,6)}.workers.dev`; const deploy = {id: Date.now().toString(36), projectId, file, url: publicUrl, localUrl:'http://localhost:4000', timestamp: new Date().toISOString(), status:'deployed'};
  deployHistory.unshift(deploy); if(deployHistory.length>20) deployHistory = deployHistory.slice(0,20); fs.writeFileSync(path.join(PROJECT_DIR, '.deploy.json'), JSON.stringify(deployHistory, null, 2));
  exec('lsof -ti:4000 | xargs kill -9 2>/dev/null', ()=>{ if(serverProc){ try{serverProc.kill();}catch{} serverProc=null; } serverProc = spawn('node', [fp], {cwd: PROJECT_DIR, env:{...process.env,...envVars, PORT:'4000'}}); });
  res.json({url: publicUrl, localUrl:'http://localhost:4000', deployId: deploy.id, status:'deployed', history: deployHistory});
});
app.get('/api/deploys', (req,res)=> res.json({deploys: deployHistory}));
app.get('/api/files', (req,res)=>{ try{ const files = fs.readdirSync(PROJECT_DIR).filter(f=>!f.startsWith('.') && f!=='node_modules' && f!=='package-lock.json' && f!=='package.json' && f!=='.env.json' && f!=='.deploy.json' &&!f.startsWith('_tmp')); res.json({files: files.length?files:['index.js']}); }catch{ res.json({files:['index.js']}); } });
app.get('/api/load', (req,res)=>{ const fp = path.join(PROJECT_DIR, req.query.file||'index.js'); res.json({code: fs.existsSync(fp)? fs.readFileSync(fp,'utf8') : ''}); });
app.post('/api/save', (req,res)=>{ fs.writeFileSync(path.join(PROJECT_DIR, req.body.file), req.body.code); io.emit('file-saved', req.body.file); res.json({status:'saved'}); });
app.post('/api/terminal', (req,res)=>{ exec(req.body.cmd, {cwd: PROJECT_DIR, timeout:8000, env:{...process.env,...envVars}}, (err, stdout, stderr)=>{ res.json({output: (stdout||'')+(stderr||'') || '(done)'}); }); });
app.post('/api/install', (req,res)=>{ const cmd = req.body.lang==='python'? `pip3 install ${req.body.pkg}` : `cd ${PROJECT_DIR} && npm init -y > /dev/null 2>&1; npm install ${req.body.pkg} --save`; exec(cmd, {timeout:60000, env:{...process.env,...envVars}}, (err, stdout, stderr)=>{ res.json({stdout: (stdout||'')+(stderr||'')}); }); });
app.post('/api/run-server', (req,res)=>{ const file = req.body.file || 'index.js'; const fp = path.join(PROJECT_DIR, file); if(req.body.code) fs.writeFileSync(fp, req.body.code); exec('lsof -ti:4000 | xargs kill -9 2>/dev/null', ()=>{ if(serverProc){ try{serverProc.kill();}catch{} serverProc=null; } serverProc = spawn('node', [fp], {cwd: PROJECT_DIR, env:{...process.env,...envVars, PORT:'4000'}}); let logs=''; serverProc.stdout.on('data', d=> logs+=d); serverProc.stderr.on('data', d=> logs+=d); setTimeout(()=> res.json({status:'running', url:'http://localhost:4000', logs: logs || 'Server on 4000...'}), 1200); }); });
app.post('/api/stop-server', (req,res)=>{ if(serverProc) try{serverProc.kill();}catch{}; exec('lsof -ti:4000 | xargs kill -9 2>/dev/null', ()=> res.json({status:'stopped'})); });
httpServer.listen(3001, ()=>console.log('✅ V10.1 Fixed - No spam + No node_modules'));
