import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_DIR = path.join('..','projects','demo-project');
if(!fs.existsSync(PROJECT_DIR)) fs.mkdirSync(PROJECT_DIR, {recursive:true});

app.get('/api/load', (req,res)=>{
  const file = req.query.file || 'index.js';
  const filePath = path.join(PROJECT_DIR, file);
  if(fs.existsSync(filePath)) res.json({code: fs.readFileSync(filePath,'utf8')});
  else res.json({code: `// ${file}\nconsole.log("Hello from ${file}");`});
});

app.post('/api/save', (req,res)=>{
  const {code, file='index.js'} = req.body;
  fs.writeFileSync(path.join(PROJECT_DIR, file), code);
  res.json({status:'saved '+file});
});

app.post('/api/execute', async (req,res)=>{
  const {code} = req.body;
  const tmpFile = `/tmp/code-${Date.now()}.js`;
  fs.writeFileSync(tmpFile, code);
  try {
    const {stdout, stderr} = await execAsync(`docker run --rm -v ${tmpFile}:/app/index.js node:20-alpine node /app/index.js`, {timeout:15000});
    res.json({stdout, stderr, mode:'Docker REAL ✅ v20.20.2'});
  } catch(e){
    res.json({stdout: (e.stdout||'') + '\n' + (e.stderr||e.message), mode:'Docker REAL ✅'});
  }
});

app.listen(3001, ()=> console.log('✅ Backend with FILE EXPLORER support on 3001'));
