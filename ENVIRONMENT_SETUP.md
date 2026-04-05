# Environment Setup Guide

This document lists all required environment variables and where to get them.

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in all values (see below)
3. Set Supabase secrets for edge functions

## Environment Variables

### Frontend (exposed to browser)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

**Where to get:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Backend (scripts + edge functions)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENROUTER_API_KEY=sk-or-v1-...
JINA_API_KEY=jina_...
```

**Where to get:**

1. **SUPABASE_URL** — Same as `VITE_SUPABASE_URL`

2. **SUPABASE_SERVICE_ROLE_KEY** — Supabase Dashboard → Settings → API → "service_role" key (keep secret!)

3. **OPENROUTER_API_KEY** — [OpenRouter](https://openrouter.ai/keys)
   - Sign up at openrouter.ai
   - Create a new API key
   - Used for LLM generation (gemini-2.5-flash)

4. **JINA_API_KEY** — [Jina AI](https://jina.ai)
   - Sign up at jina.ai
   - Go to dashboard or embeddings page
   - Create a new API key
   - Free tier: 1M tokens/month
   - **Only used by edge functions for query-time embedding** (not for bulk scraping)

## Setting Supabase Secrets (for edge functions)

Edge functions can't read `.env` — they need secrets set via CLI:

```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your_key_here
supabase secrets set JINA_API_KEY=jina_your_key_here
```

Verify they're set:

```bash
supabase secrets list
```

## Security Checklist

- [ ] `.env` is in `.gitignore` (already done)
- [ ] Never commit `.env` to git
- [ ] Use `.env.example` for documentation only
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to frontend
- [ ] All API keys are loaded from environment, not hardcoded

## Verification

Run this to check if all keys are set:

```bash
# Check local .env
node -e "require('dotenv').config(); console.log({
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENROUTER: !!process.env.OPENROUTER_API_KEY,
  JINA: !!process.env.JINA_API_KEY
})"

# Check Supabase secrets
supabase secrets list
```

## What Uses What

| Component | Keys Used |
|-----------|-----------|
| Frontend (React) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Scrape script | None (just fetches HTML) |
| Ingest script (Python) | None (local embeddings via sentence-transformers) |
| Sync script | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Edge functions | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `JINA_API_KEY` |

## Troubleshooting

**"OPENROUTER_API_KEY is not configured"** in edge function logs
→ Run `supabase secrets set OPENROUTER_API_KEY=...`

**"JINA_API_KEY not configured"** in edge function logs
→ Run `supabase secrets set JINA_API_KEY=...` (only needed for edge functions, not local scripts)

**Frontend can't connect to Supabase**
→ Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
