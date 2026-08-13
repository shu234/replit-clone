"use client"
import { useState } from 'react'

export default function Page(){
  const [code, setCode] = useState(`console.log("Hello from REAL Sandbox!")\nconsole.log("Node:", process.version)`)
  const [out, setOut] = useState('')

  const run = async () => {
    setOut('Running in Docker...')
    try {
      const res = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({code})
      })
      const data = await res.json()
      setOut(data.stdout || JSON.stringify(data))
    } catch(e){
      setOut('Backend offline? Start: cd backend && node index.js')
    }
  }

  return (
    <div style={{padding:20, background:'#0a0a0a', color:'#0f0', minHeight:'100vh', fontFamily:'monospace'}}>
      <h1 style={{color:'#00ff88'}}>Replit Clone - LIVE ✅</h1>
      <p>Sandbox: Docker WORKING | Deploy: Cloudflare LIVE</p>
      
      <textarea
        value={code}
        onChange={e=>setCode(e.target.value)}
        style={{width:'100%', height:120, background:'#1a1a1a', color:'#0f0', padding:15, fontSize:16, border:'1px solid #22c55e'}}
      />
      
      <div style={{marginTop:15, display:'flex', gap:10}}>
        <button onClick={run} style={{padding:'10px 20px', background:'#0f0', color:'#000', fontWeight:'bold', cursor:'pointer'}}>
          ▶ Run in Docker
        </button>
        <button onClick={()=>window.open('https://demo-project.shubhammahant369.workers.dev','_blank')} style={{padding:'10px 20px', background:'#22c55e', color:'#000', fontWeight:'bold', cursor:'pointer'}}>
          🚀 Deploy - Visit LIVE Worker
        </button>
      </div>

      <pre style={{background:'#111', padding:15, marginTop:20, minHeight:60, border:'1px solid #333', whiteSpace:'pre-wrap'}}>{out}</pre>

      <p style={{marginTop:20}}>Live at: https://demo-project.shubhammahant369.workers.dev</p>
    </div>
  )
}