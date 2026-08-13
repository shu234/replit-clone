"use client"
import { useState } from 'react'
import Editor from '@monaco-editor/react'

export default function Page(){
  const [files, setFiles] = useState(['index.js', 'app.js', 'test.js'])
  const [activeFile, setActiveFile] = useState('index.js')
  const [code, setCode] = useState(`console.log("Hello from REAL Sandbox!")
console.log("Node:", process.version)
console.log("Files:", require('fs').readdirSync('.'))`)
  const [out, setOut] = useState('')
  const [newFile, setNewFile] = useState('')

  const loadFile = async (file: string) => {
    setActiveFile(file)
    try {
      const res = await fetch(`http://localhost:3001/api/load?file=${file}`)
      const data = await res.json()
      if(data.code) setCode(data.code)
    } catch { 
      setCode(`// ${file}\nconsole.log("Hello from ${file}")\nconsole.log("Node:", process.version)`) 
    }
  }

  const saveFile = async () => {
    const res = await fetch('http://localhost:3001/api/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({code, file: activeFile})
    })
    const d = await res.json()
    setOut(`Saved ${activeFile} ✅\n` + JSON.stringify(d))
  }

  const run = async () => {
    setOut('Running in Docker REAL v20.20.2...')
    try {
      const res = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({code})
      })
      const data = await res.json()
      setOut((data.stdout||'') + '\n\nMode: ' + data.mode)
    } catch(e:any) {
      setOut('Error: ' + e.message)
    }
  }

  return (
    <div style={{display:'flex', height:'100vh', background:'#0e1525', color:'white'}}>
      <div style={{width:'220px', background:'#1c2333', padding:'12px', borderRight:'1px solid #2b3245'}}>
        <h3 style={{color:'#00d8ff', marginBottom:'10px'}}>📁 Files</h3>
        {files.map(f=>(
          <div key={f} onClick={()=>loadFile(f)} 
            style={{padding:'8px', cursor:'pointer', background: activeFile===f ? '#2b3245' : 'transparent', borderRadius:'4px', margin:'3px 0'}}>
            {activeFile===f ? '📄' : '📃'} {f}
          </div>
        ))}
        <div style={{marginTop:'15px', display:'flex', gap:'5px'}}>
          <input value={newFile} onChange={e=>setNewFile(e.target.value)} placeholder="new.js" 
            style={{width:'120px', background:'#0e1525', color:'white', border:'1px solid #444', padding:'5px', borderRadius:'3px'}}/>
          <button onClick={()=>{if(newFile){setFiles([...files,newFile]); setActiveFile(newFile); setNewFile(''); setCode(`// ${newFile}\nconsole.log("New file: ${newFile}")`)}}} 
            style={{background:'#444', color:'white', border:'none', padding:'5px 10px', borderRadius:'3px', cursor:'pointer'}}>+</button>
        </div>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'10px 15px', background:'#1c2333', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>⚡ Replit Clone LIVE - {activeFile} - Docker REAL ✅ v20.20.2</span>
          <div>
            <button onClick={saveFile} style={{marginRight:'10px', background:'#2b3245', color:'white', border:'1px solid #444', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}>💾 Save</button>
            <button onClick={run} style={{background:'#0fa', color:'black', fontWeight:'bold', padding:'6px 16px', border:'none', borderRadius:'4px', cursor:'pointer'}}>▶ Run</button>
          </div>
        </div>
        <Editor height="60%" defaultLanguage="javascript" value={code} onChange={(v)=>setCode(v||'')} theme="vs-dark" />
        <div style={{height:'40%', background:'black', color:'#0f0', padding:'12px', whiteSpace:'pre-wrap', fontFamily:'monospace', overflow:'auto', borderTop:'1px solid #333'}}>
          <div style={{color:'#00d8ff', marginBottom:'5px'}}>Output</div>
          {out || 'Click Run to execute in Docker node:20-alpine v20.20.2'}
        </div>
      </div>
    </div>
  )
}
