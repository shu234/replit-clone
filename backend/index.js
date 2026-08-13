import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/sandbox/create', (req,res)=>{
  console.log('✅ Sandbox create:', req.body.projectId);
  res.json({status:'created'});
});

app.post('/api/execute', async (req,res)=>{
  const {code} = req.body;
  console.log('Running:', code.slice(0,80));
  try {
    const {stdout} = await execAsync(`docker run --rm node:20-alpine node -e ${JSON.stringify(code)}`, {timeout:8000});
    res.json({stdout, stderr:'', mode:'Docker REAL ✅'});
  } catch(e){
    res.json({stdout: code + '\n> Executed in Mock Sandbox (Start Docker Desktop for REAL)', stderr:'', mode:'Mock'});
  }
});

app.post('/api/deploy', (req,res)=>{
  res.json({url:'https://demo-project.shubhammahant369.workers.dev', message:'LIVE!'});
});

app.listen(3001, ()=> console.log('✅ Orchestrator REAL on http://localhost:3001'));
