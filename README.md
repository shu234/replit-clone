# ⚡ Replit Clone - Cloud IDE with AI Autocomplete

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![AI](https://img.shields.io/badge/AI-Groq%20Llama%203.1-orange) ![Live](https://img.shields.io/badge/Live-Vercel-success)

> A full-stack browser-based IDE inspired by Replit, featuring real-time AI code autocomplete (like Copilot), multiplayer cursors, and polyglot code execution.

**🔗 Live Demo:** https://replit-clone-swart.vercel.app  
**🔗 Backend:** https://replit-clone-i1ra.onrender.com  
**📦 GitHub:** https://github.com/shu234/replit-clone

---

### 🎥 Demo Preview

```
- Type `function add(a,b){` + Press Tab → AI completes ` return a + b; }`
- Open 2 tabs → See live cursors of other users 👥
- Run Node / Python / C / C++ / Go in browser
```

**Screenshot:** (Your V10.3 screenshot)
![V10.3](https://via.placeholder.com/800x400?text=V10.3+-+AI+Fixed+%2B+Multiplayer)

---

### ✨ Features

#### 🤖 Real AI Autocomplete (Like GitHub Copilot)
- **Tab to Complete** - Ghost text + Tab to accept
- **Groq Llama-3.1-8b-instant** - <800ms latency
- **Smart Context** - Sends only 400 chars before cursor, filters noise
- **Debounced** - 800ms debounce to save API calls

#### 👥 Real-time Multiplayer
- Live cursors with colors (Socket.io)
- Code sync across users
- Online users count
- File saved broadcast

#### 💻 Polyglot Execution
- **Node.js** - `node /tmp/index.js` with ENV injection
- **Python** - `python3` with stdin support
- **C / C++** - `gcc / g++` compilation
- **Go** - `go run`
- Stdin input, ENV variables, timeout handling

#### 🛠️ Full IDE Experience
- **Monaco Editor** - Same engine as VS Code
- **File System** - Create, save, load files
- **Terminal** - xterm.js with custom commands
- **Live Preview** - HTML preview with iframe
- **ENV Editor** - Key=Value management
- **Package Installer** - npm / pip
- **Deploy** - One-click deploy (WIP)

---

### 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router) + TypeScript
- Monaco Editor (@monaco-editor/react)
- Socket.io-client
- xterm.js + xterm-addon-fit

**Backend:**
- Node.js + Express + TypeScript
- Socket.io for real-time
- child_process for code execution
- Groq API (`https://api.groq.com/openai/v1/chat/completions`)

**Deployment:**
- Frontend: Vercel
- Backend: Render (Free tier)

---

### 🚀 Quick Start (Local)

```bash
# Clone
git clone https://github.com/shu234/replit-clone.git
cd replit-clone

# Backend
cd backend
npm install
# Create .env
echo "GROQ_API_KEY=gsk_your_key_here" > .env
npm run dev # Runs on 3001 -> http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev # Runs on 3000
```

**Get Groq API Key:** https://console.groq.com/keys (Free, 100k tokens/day)

---

### 🔧 How AI Works

```js
// Frontend sends:
{
  code: "function add(a,b){", // last 400 chars before cursor
  cursorLine: 1
}

// Backend calls Groq:
POST https://api.groq.com/openai/v1/chat/completions
model: "llama-3.1-8b-instant"
prompt: "Complete ONLY next 5-10 chars of code..."

// Returns:
{ suggestion: " return a + b; }" }
```

**Why Groq not OpenAI?** 
- 10x faster, free tier, OpenAI compatible endpoint

---

### 📂 Project Structure

```
replit-clone/
├── frontend/
│   └── app/
│       └── page.tsx  # V10.3 - AI Fixed + Multiplayer
├── backend/
│   └── index.js      # V10.3 - Groq AI + Execution Engine
└── projects/
    └── demo-project/ # User files storage
```

---

### 🗺️ Roadmap

**V10.3 ✅ Current - AI Fixed**
- [x] Groq AI autocomplete (Tab)
- [x] Multiplayer cursors
- [x] 5 language execution
- [x] Terminal + ENV

**V10.4 (This Week)**
- [ ] Fix preview JSON bug
- [ ] Fix ghost duplication (suffix only)
- [ ] Add syntax error highlighting

**V11 - For Recruiters**
- [ ] GitHub Auth (NextAuth) - private files
- [ ] Room ID sharing - like Replit multiplayer
- [ ] Supabase - persistent file storage
- [ ] Mobile responsive

**V12 - AI Wow Factor**
- [ ] "Fix Error with AI" button
- [ ] Chat sidebar - "Explain this code"
- [ ] AI code generation from prompt

---

### 💼 For Recruiters

**What I Learned:**
- Built Monaco Editor custom Tab action with inline suggestions
- Implemented Socket.io rooms for live cursors + code sync
- Designed secure code execution sandbox with timeout, stdin, ENV injection
- Integrated Groq Llama-3.1 for <1s AI autocomplete
- Deployed full-stack with CORS, environment handling

**Live Stats:**
- Users Online: Real-time
- Languages: 5 (Node, Python, C, C++, Go)
- AI Latency: ~600ms
- Uptime: 99% (Render + Vercel)

**Contact:** Shubham Mahant - [GitHub](https://github.com/shu234) | [LinkedIn] | Janjgir, Chhattisgarh

---

### 📄 License

MIT - Feel free to fork!

---

### 🙏 Acknowledgments

- Monaco Editor (VS Code team)
- Groq for free fast LLM
- Replit for inspiration
- Socket.io

**⭐ Star this repo if you liked it!**

Made with ❤️ by Shubham Mahant
