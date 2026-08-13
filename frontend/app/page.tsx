"use client"
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

export default function Page(){
  const [code, setCode] = useState(`console.log("Hello from Replit Clone!")
console.log("Node:", process.version)
console.log("Time:", new Date().toISOString())`)
  const [out, setOut] = useState('')
  const [saving, setSaving] = useState(false)

  const run = async () => {
    setOut('Running in Docker...')
    try {
      const res = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({code, projectId: 'demo-project'})
      })
      const data = await res.json()
      setOut(data.stdout + (data.stderr ? '\nERR: '+data.stderr : '') + '\n\nMode: '+(data.mode||''))
    } catch(e){
      setOut('Backend offline? Run: cd ../backend && node index.js')
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('http://localhost:3001/api/save', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({code, projectId: 'demo-project', file: 'index.js'})
      })
      setOut(prev => '✅ Saved to projects/demo-project/index.js\n' + prev)
    } catch(e){
      setOut('Save failed - backend offline?')
    }
    setSaving(false)
    setTimeout(()=>setSaving(false), 1000)
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#0e0e10', color:'#fff'}}>
      <div style={{padding:'10px 20px', background:'#1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333'}}>
        <h1 style={{margin:0, fontSize:18}}>⚡ Replit Clone <span style={{color:'#22c55e'}}>LIVE</span></h1>
        <div style={{display:'flex', gap:10}}>
          <button onClick={save} style={{padding:'6px 14px', background: saving ? '#22c55e' : '#333', cursor:'pointer', border:'1px solid #444'}}>{saving ? 'Saved!' : '💾 Save'}</button>
          <button onClick={run} style={{padding:'6px 14px', background:'#22c55e', color:'#000', fontWeight:'bold', cursor:'pointer', border:'none'}}>▶ Run</button>
          <button onClick={()=>window.open('https://demo-project.shubhammahant369.workers.dev','_blank')} style={{padding:'6px 14px', background:'#0ea5e9', color:'#fff', cursor:'pointer', border:'none'}}>🚀 Live</button>
        </div>
      </div>
      
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        <div style={{flex:1, borderRight:'1px solid #333'}}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(v)=>setCode(v||'')}
            options={{fontSize:14, minimap:{enabled:false}, automaticLayout:true}}
          />
        </div>
        <div style={{width:'40%', background:'#111', padding:15, overflow:'auto'}}>
          <h3 style={{marginTop:0, color:'#22c55e'}}>Output</h3>
          <pre style={{whiteSpace:'pre-wrap', fontSize:13, color:'#0f0'}}>{out || 'Click Run to execute in Docker container...'}</pre>
        </div>
      </div>
    </div>
  )
}
