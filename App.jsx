import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function App() {
  const [files, setFiles] = useState(['index.js', 'app.js', 'test.js']);
  const [activeFile, setActiveFile] = useState('index.js');
  const [code, setCode] = useState('console.log("Hello from REAL Sandbox!")');
  const [output, setOutput] = useState('');
  const [newFile, setNewFile] = useState('');

  const loadFile = async (file) => {
    setActiveFile(file);
    try {
      const res = await fetch(`http://localhost:3001/api/load?file=${file}`);
      const data = await res.json();
      if(data.code) setCode(data.code);
    } catch { setCode(`// ${file}\nconsole.log("Hello from ${file}")`); }
  };

  const saveFile = async () => {
    await fetch('http://localhost:3001/api/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({code, file: activeFile})
    });
    alert(`Saved ${activeFile} ✅`);
  };

  const createFile = () => {
    if(!newFile) return;
    setFiles([...files, newFile]);
    setActiveFile(newFile);
    setCode(`// ${newFile}\nconsole.log("New file: ${newFile}")`);
    setNewFile('');
  };

  const runCode = async () => {
    setOutput('Running in Docker REAL...');
    const res = await fetch('http://localhost:3001/api/execute', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({code})
    });
    const data = await res.json();
    setOutput(data.stdout + '\n\nMode: ' + data.mode);
  };

  return (
    <div style={{display:'flex', height:'100vh', background:'#0e1525', color:'white'}}>
      {/* File Explorer */}
      <div style={{width:'200px', background:'#1c2333', padding:'10px', borderRight:'1px solid #2b3245'}}>
        <h3 style={{color:'#00d8ff'}}>📁 Files</h3>
        {files.map(f=>(
          <div key={f} onClick={()=>loadFile(f)} 
            style={{padding:'6px', cursor:'pointer', background: activeFile===f ? '#2b3245' : 'transparent', margin:'2px 0', borderRadius:'4px'}}>
            {f === activeFile ? '📄 ' : '📃 '}{f}
          </div>
        ))}
        <div style={{marginTop:'15px', display:'flex'}}>
          <input value={newFile} onChange={e=>setNewFile(e.target.value)} placeholder="new.js" style={{width:'110px', background:'#0e1525', color:'white', border:'1px solid #444', padding:'4px'}}/>
          <button onClick={createFile} style={{marginLeft:'5px'}}>+</button>
        </div>
      </div>

      {/* Editor */}
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'10px', background:'#1c2333', display:'flex', justifyContent:'space-between'}}>
          <span>⚡ Replit Clone LIVE - {activeFile} - Docker REAL ✅</span>
          <div>
            <button onClick={saveFile} style={{marginRight:'10px'}}>💾 Save</button>
            <button onClick={runCode} style={{background:'#0fa', padding:'6px 12px'}}>▶ Run</button>
          </div>
        </div>
        <Editor height="60%" defaultLanguage="javascript" value={code} onChange={setCode} theme="vs-dark" />
        <div style={{height:'40%', background:'black', color:'#0f0', padding:'10px', overflow:'auto', whiteSpace:'pre-wrap', fontFamily:'monospace'}}>
          <b>Output</b>\n{output || 'Click Run to execute in Docker node:20-alpine v20.20.2'}
        </div>
      </div>
    </div>
  );
}
