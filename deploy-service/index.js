import express from 'express'; import cors from 'cors'; import fs from 'fs'; import path from 'path'; import { exec } from 'child_process';
const app = express(); app.use(cors()); app.use(express.json({limit:'20mb'}));
app.post('/deploy', (req,res)=>{
  const { projectId, files } = req.body;
  const dir = `/tmp/deploy-${projectId}`;
  fs.mkdirSync(dir, {recursive:true});
  for (const [name, content] of Object.entries(files||{})) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  const workerCode = `
  export default {
    async fetch(req) {
      const url = new URL(req.url);
      const file = url.pathname === '/'? '/index.html' : url.pathname;
      try {
        const content = ${JSON.stringify(files?.['index.js']||'console.log("hello")')};
        return new Response(\`<html><body><h1>${projectId} is LIVE!</h1><pre>\${content}</pre><script>\${content}</script></body></html>\`, {headers:{'Content-Type':'text/html'}});
      } catch(e){ return new Response('Error: '+e.message, {status:500}) }
    }
  }`;
  fs.writeFileSync(path.join(dir, 'worker.js'), workerCode);
  fs.writeFileSync(path.join(dir, 'wrangler.toml'), `name = "${projectId}"\nmain = "worker.js"\ncompatibility_date = "2024-01-01"\n`);

  exec(`cd ${dir} && wrangler deploy --name ${projectId} 2>&1`, {timeout: 60000}, (err, stdout)=>{
    console.log(stdout);
    // Extract URL from wrangler output
    const match = stdout.match(/https:\/\/.*\.workers\.dev/);
    const url = match? match[0] : `https://${projectId}.workers.dev`;
    res.json({ url, logs: stdout, status: err? 'failed' : 'deployed' });
  });
});
app.listen(3002, ()=>console.log('Deploy service on 3002'));
