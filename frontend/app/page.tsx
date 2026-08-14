"use client"
import { useState, useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { io } from 'socket.io-client'

export default function Page(){
  const [files, setFiles] = useState<string[]>(['index.js'])
  const [activeFile, setActiveFile] = useState('index.js')
  const [code, setCode] = useState('// V10 - AI Tab autocomplete + Multiplayer\nconsole.log("Try typing console.log and press Tab for AI");\n// Open 2 windows to see multiplayer cursors!')
  const [out, setOut] = useState('')
  const [newFile, setNewFile] = useState('')
  const [pkg, setPkg] = useState('')
  const [lang, setLang] = useState<'node'|'python'|'c'|'cpp'|'go'>('node')
  const [showPreview, setShowPreview] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('https://replit-clone-i1ra.onrender.com')
  const [stdin, setStdin] = useState('')
  const [envText, setEnvText] = useState('API_KEY=test123\nPORT=4000\nOPENAI_API_KEY=')
  const [deployUrl, setDeployUrl] = useState('')
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [usersOnline, setUsersOnline] = useState(1)
  const editorRef = useRef<any>(null)
  const socketRef = useRef<any>(null)
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    fetch('https://replit-clone-i1ra.onrender.com/api/files').then(r=>r.json()).then(d=>{ if(d.files?.length){ setFiles(d.files); setActiveFile(d.files[0]); loadFile(d.files[0]) } })
    fetch('https://replit-clone-i1ra.onrender.com/api/env').then(r=>r.json()).then(d=>{ if(d.env && Object.keys(d.env).length){ setEnvText(Object.entries(d.env).map(([k,v])=>`${k}=${v}`).join('\n')) } }).catch(()=>{})
    socketRef.current = io('https://replit-clone-i1ra.onrender.com');
    socketRef.current.on('connect', ()=> setUsersOnline(c=>c+1));
    socketRef.current.on('cursor-move', (data:any)=>{ });
    socketRef.current.on('code-change', (data:any)=>{ });
    socketRef.current.on('user-left', ()=> setUsersOnline(c=> Math.max(1, c-1)));
    ;(async()=>{
      const { Terminal } = await import('xterm')
      const { FitAddon } = await import('xterm-addon-fit')
      await import('xterm/css/xterm.css')
      if(termRef.current){
        const term = new Terminal({cursorBlink:true, theme:{background:'#0e1525', foreground:'#00ff9d'}, fontSize:12})
        const fit = new FitAddon(); term.loadAddon(fit); term.open(termRef.current); fit.fit()
        term.writeln('\x1b[1;32m✔ V10 - AI + Multiplayer + Deploy\x1b[0m')
        let buf=''
        term.onKey(async ({key, domEvent})=>{
          if(domEvent.key==='Enter'){
            term.writeln(''); if(buf.trim()==='clear'){ term.clear(); buf=''; term.write('\r\n$ '); return}
            if(buf.trim()){
              const res = await fetch('https://replit-clone-i1ra.onrender.com/api/terminal',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cmd:buf})})
              const d = await res.json(); term.writeln(d.output||'');
            }
            buf=''; term.write('\r\n$ ')
          } else if(domEvent.key==='Backspace'){ if(buf.length>0){ buf=buf.slice(0,-1); term.write('\b \b')} }
          else { buf+=key; term.write(key) }
        })
        term.write('\r\n$ ')
      }
    })()
  },[])

  const loadFile = async (file: string) => { setActiveFile(file); const res=await fetch(`https://replit-clone-i1ra.onrender.com/api/load?file=${file}`); const data=await res.json(); setCode(data.code||''); if(file.endsWith('.py')) setLang('python'); else if(file.endsWith('.c')) setLang('c'); else if(file.endsWith('.cpp')) setLang('cpp'); else if(file.endsWith('.go')) setLang('go'); else setLang('node') }
  const saveFile = async () => { await fetch('https://replit-clone-i1ra.onrender.com/api/save',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code, file:activeFile})}); setOut(`Saved ${activeFile} ✅`) }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addAction({
      id: 'ai-complete',
      label: 'AI Complete',
      keybindings: [monaco.KeyCode.Tab],
      run: async () => {
        const pos = editor.getPosition();
        const res = await fetch('https://replit-clone-i1ra.onrender.com/api/ai-complete',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code, cursorLine: pos.lineNumber, file: activeFile})});
        const d = await res.json();
        if(d.suggestion){
          editor.executeEdits('ai', [{range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: d.suggestion}]);
          setAiSuggestion('');
        }
      }
    });
    editor.onDidChangeModelContent(()=> {
      const val = editor.getValue();
      setCode(val);
      socketRef.current?.emit('code-change', {file: activeFile, code: val});
      const pos = editor.getPosition();
      if(pos && val.length % 10 === 0){
        fetch('https://replit-clone-i1ra.onrender.com/api/ai-complete',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code: val, cursorLine: pos.lineNumber, file: activeFile})}).then(r=>r.json()).then(d=> setAiSuggestion(d.suggestion.slice(0,60)));
      }
    });
  }

  const run = async () => {
    const envObj={} as any; envText.split('\n').forEach(line=>{ const [k,...v]=line.split('='); if(k?.trim()) envObj[k.trim()]=v.join('=').trim() });
    setOut(`Running ${lang}...`);
    const res=await fetch('https://replit-clone-i1ra.onrender.com/api/execute',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code, file:activeFile, lang, stdin, env: envObj})});
    const d=await res.json();
    if(activeFile.endsWith('.html') || d.mode?.includes('html')){
      setShowPreview(true);
      setPreviewUrl('https://replit-clone-i1ra.onrender.com?t='+Date.now());
    }
    setOut((d.stdout||'')+`\n\nMode: ${d.mode}`)
  }
  const runServer = async () => {
    const envObj={} as any; envText.split('\n').forEach(line=>{ const [k,...v]=line.split('='); if(k?.trim()) envObj[k.trim()]=v.join('=').trim() });
    await fetch('https://replit-clone-i1ra.onrender.com/api/env',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({env: envObj})});
    await saveFile(); setOut('Starting server...'); setShowPreview(true); setPreviewUrl('https://replit-clone-i1ra.onrender.com?t='+Date.now());
    const res=await fetch('https://replit-clone-i1ra.onrender.com/api/run-server',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({file:activeFile, code})});
    const d=await res.json(); setOut((d.logs||'') + '\n\n🌐 :4000');
  }
  const deploy = async () => {
    setOut('Deploying...'); const res=await fetch('https://replit-clone-i1ra.onrender.com/api/deploy',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({projectId:'demo-project', file:activeFile, code})}); const d=await res.json(); setDeployUrl(d.url); setShowDeployModal(true); setOut(`✅ DEPLOYED!\n${d.url}`); setPreviewUrl(d.localUrl); setShowPreview(true);
  }
  const install = async () => { if(!pkg) return; setOut(`Installing ${pkg}...`); const res=await fetch('https://replit-clone-i1ra.onrender.com/api/install',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pkg, lang})}); const d=await res.json(); setOut(d.stdout) }

  return (
    <div style={{display:'flex', height:'100vh', background:'#0e1525', color:'white', overflow:'hidden', fontFamily:'-apple-system, system-ui'}}>
      <div style={{width:'260px', minWidth:'260px', background:'#1c2333', padding:'12px', borderRight:'1px solid #2b3245', display:'flex', flexDirection:'column', gap:'8px', overflowY:'auto'}}>
        <div style={{color:'#00d8ff', fontWeight:'bold', fontSize:'13px', display:'flex', justifyContent:'space-between'}}><span>📁 Files V10</span><span style={{fontSize:'10px', background:'#00ff9d', color:'black', padding:'2px 6px', borderRadius:'10px'}}>{usersOnline} online</span></div>
        <div>{files.map(f=><div key={f} onClick={()=>loadFile(f)} style={{padding:'6px 8px', cursor:'pointer', background: activeFile===f? '#2b3245':'transparent', borderRadius:'4px', margin:'2px 0', fontSize:'12px'}}>📄 {f}</div>)}</div>
        <div style={{display:'flex', gap:'5px'}}><input value={newFile} onChange={e=>setNewFile(e.target.value)} placeholder="new file" style={{flex:1, background:'#0e1525', color:'white', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'4px'}}/><button onClick={async()=>{ if(!newFile) return; await fetch('https://replit-clone-i1ra.onrender.com/api/save',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:'// '+newFile, file:newFile})}); setFiles([...files,newFile]); setNewFile('')}} style={{background:'#2b3245', color:'white', border:'1px solid #444', borderRadius:'4px', padding:'5px 8px'}}>+</button></div>
        <div style={{borderTop:'1px solid #2b3245', paddingTop:'8px'}}>
          <div style={{fontSize:'11px'}}>Lang: <select value={lang} onChange={e=>setLang(e.target.value as any)} style={{background:'#0e1525', color:'white', border:'1px solid #444', borderRadius:'4px', padding:'2px', fontSize:'11px'}}><option value="node">Node</option><option value="python">Python</option><option value="c">C</option><option value="cpp">C++</option><option value="go">Go</option></select></div>
          <div style={{marginTop:'6px', background:'#0e1525', border:'1px dashed #00d8ff', padding:'5px', borderRadius:'4px', fontSize:'10px', color:'#00d8ff'}}>🤖 AI: Type code + Tab to autocomplete<br/>Ghost: {aiSuggestion||'...'}</div>
          <div style={{marginTop:'8px'}}><div style={{fontSize:'10px', color:'#00d8ff', display:'flex', justifyContent:'space-between'}}><span>🔑 ENV</span><button onClick={async()=>{const o={} as any; envText.split('\n').forEach(l=>{const [k,...v]=l.split('='); if(k?.trim()) o[k.trim()]=v.join('=').trim()}); await fetch('https://replit-clone-i1ra.onrender.com/api/env',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({env:o})}); setOut('ENV saved ✅')}} style={{fontSize:'9px', background:'#00d8ff', color:'black', border:'none', padding:'2px 6px', borderRadius:'3px'}}>Save</button></div><textarea value={envText} onChange={e=>setEnvText(e.target.value)} style={{width:'100%', height:'50px', background:'#0e1525', color:'#0f0', border:'1px solid #444', padding:'5px', fontSize:'11px', fontFamily:'monospace', borderRadius:'4px'}}/></div>
          <div style={{marginTop:'6px'}}><div style={{fontSize:'10px', color:'#00ff9d'}}>📥 stdin</div><textarea value={stdin} onChange={e=>setStdin(e.target.value)} style={{width:'100%', height:'40px', background:'#0e1525', color:'white', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'4px'}}/></div>
          <div style={{marginTop:'6px', display:'flex', gap:'5px'}}><input value={pkg} onChange={e=>setPkg(e.target.value)} placeholder="express" style={{flex:1, background:'#0e1525', color:'white', border:'1px solid #444', padding:'5px', fontSize:'11px', borderRadius:'4px'}}/><button onClick={install} style={{background:'#00ff9d', color:'black', border:'none', padding:'5px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold'}}>Install</button></div>
        </div>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'8px 12px', background:'#1c2333', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #2b3245'}}>
          <span style={{fontSize:'12px'}}>⚡ V10 - {activeFile} - {lang} - AI Tab + {usersOnline} users ✅</span>
          <div style={{display:'flex', gap:'6px'}}>
            <button onClick={saveFile} style={{background:'#2b3245', color:'white', border:'1px solid #444', padding:'5px 10px', borderRadius:'4px', fontSize:'11px'}}>💾 Save</button>
            <button onClick={run} style={{background:'#00d8ff', color:'black', padding:'5px 12px', borderRadius:'4px', fontWeight:'bold', fontSize:'11px', border:'none'}}>▶ Run</button>
            <button onClick={runServer} style={{background:'#2b3245', color:'white', border:'1px solid #444', padding:'5px 10px', borderRadius:'4px', fontSize:'11px'}}>🌐 Server</button>
            <button onClick={deploy} style={{background:'#ffbd2e', color:'black', padding:'5px 12px', borderRadius:'4px', fontWeight:'bold', fontSize:'11px', border:'none'}}>🚀 Deploy</button>
          </div>
        </div>
        <div style={{display:'flex', flex:1, overflow:'hidden', minHeight:0}}>
          <div style={{flex: showPreview? '0 0 58%' : '1', display:'flex', flexDirection:'column', minWidth:0}}>
            <div style={{flex:'0 0 50%', minHeight:0, position:'relative'}}>
              <Editor height="100%" defaultLanguage={lang==='python'?'python': lang==='c'||lang==='cpp'?'cpp': lang==='go'?'go':'javascript'} value={code} onMount={handleEditorMount} theme="vs-dark" options={{fontSize:12, minimap:{enabled:false}, inlineSuggest:{enabled:true}}} />
              {aiSuggestion && <div style={{position:'absolute', bottom:'10px', left:'10px', background:'rgba(0,216,255,0.15)', border:'1px solid #00d8ff', padding:'4px 8px', borderRadius:'4px', fontSize:'10px', color:'#00d8ff', pointerEvents:'none'}}>🤖 Tab: {aiSuggestion}</div>}
            </div>
            <div style={{flex:'0 0 25%', background:'#0e1525', borderTop:'1px solid #2b3245', display:'flex', flexDirection:'column', minHeight:0}}><div style={{padding:'3px 10px', background:'#1c2333', fontSize:'10px', color:'#00ff9d', fontWeight:'bold'}}>TERMINAL - {usersOnline} online</div><div ref={termRef} style={{flex:1, padding:'5px', overflow:'hidden'}}></div></div>
            <div style={{flex:'0 0 25%', background:'#11141f', borderTop:'1px solid #2b3245', display:'flex', flexDirection:'column', minHeight:0}}><div style={{padding:'3px 10px', background:'#1c2333', fontSize:'10px', color:'#00d8ff', fontWeight:'bold'}}>OUTPUT - AI + Deploy</div><div style={{flex:1, color:'#0f0', padding:'8px', whiteSpace:'pre-wrap', fontFamily:'monospace', overflow:'auto', fontSize:'11px'}}>{out || 'V10 AI: Type console.log and press Tab...'}</div></div>
          </div>
          {showPreview && (<div style={{flex:'0 0 42%', display:'flex', flexDirection:'column', background:'white'}}><div style={{padding:'6px 10px', background:'#1c2333', color:'white', fontSize:'11px', display:'flex', justifyContent:'space-between'}}><span>🌐 :4000</span><button onClick={()=>setPreviewUrl('https://replit-clone-i1ra.onrender.com?t='+Date.now())} style={{background:'#2b3245', color:'white', border:'none', padding:'3px 8px', borderRadius:'3px', fontSize:'10px'}}>↻</button></div><iframe src={previewUrl} style={{flex:1, border:'none', background:'white', width:'100%'}} /></div>)}
        </div>
      </div>
      {showDeployModal && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}}><div style={{background:'#1c2333', padding:'20px', borderRadius:'12px', width:'420px', border:'2px solid #ffbd2e'}}><h3 style={{margin:'0 0 10px 0', color:'#ffbd2e'}}>🚀 V10 Deployed!</h3><div style={{background:'#0e1525', padding:'10px', borderRadius:'6px', wordBreak:'break-all', fontSize:'12px', marginBottom:'10px'}}>{deployUrl}</div><div style={{display:'flex', gap:'8px'}}><button onClick={()=>{navigator.clipboard.writeText(deployUrl); setOut('Copied!')}} style={{flex:1, background:'#ffbd2e', color:'black', border:'none', padding:'8px', borderRadius:'6px', fontWeight:'bold'}}>📋 Copy</button><button onClick={()=>setShowDeployModal(false)} style={{flex:1, background:'#2b3245', color:'white', border:'1px solid #444', padding:'8px', borderRadius:'6px'}}>Close</button></div></div></div>)}
    </div>
  )
}