# 🚀 Replit Clone - Production Cloud IDE

**Live:** https://demo-project.shubhammahant369.workers.dev
**GitHub:** https://github.com/shu234/replit-clone

A fully functional Replit clone built from scratch - from editor to production deploy.

## ✨ Features
- Monaco Editor (VS Code in browser)
- Docker Executor - isolated container per project
- Real-time Terminal (xterm.js + WebSocket)
- One-Click Deploy to Cloudflare Workers
- Multi-tenant architecture

## 🏗️ Architecture
Frontend (Next.js) → Orchestrator (Express :3001) → Docker Sandbox → Cloudflare Workers → S3

## Tech Stack
Next.js 14, TypeScript, Monaco, xterm.js, Node.js, Express, Docker, WebSockets, Cloudflare Workers, Wrangler

## How to Run
```bash
cd backend && node index.js
cd frontend && npm run dev
# http://localhost:3000