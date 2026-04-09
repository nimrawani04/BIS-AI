#  <img src="./public/favicon.ico" height=25 style="border-radius:50%;"> BIS AI — Bureau of Indian Standards

> AI-powered product safety and certification platform for Indian consumers, built with an offline-first, multilingual design.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-green) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

---

## Overview

**BIS AI** is an intelligent assistant that helps Indian consumers access and understand information from the Bureau of Indian Standards (BIS). The system leverages a **Retrieval-Augmented Generation (RAG)** pipeline to fetch verified data from BIS sources and deliver accurate, context-aware responses through an interactive chatbot.

Key features include multilingual support (English & Hindi), simple and detailed explanation modes, voice and image-based input, conversation history, and a product image scanner for BIS/ISI detection. The platform also offers certification guidelines, a standards explorer, risk/heat map visualisation, and safety insights.

Designed with accessibility in mind, BIS AI supports low-bandwidth environments, offline-first functionality, and light/dark mode for enhanced usability.

---

## Features

- RAG-based AI chatbot for BIS queries with streaming responses
- Multilingual support — English & Hindi
- Simple / Detailed response mode toggle
- Voice input and product image scanner (ISI/BIS mark detection)
- Conversation history with local persistence
- Offline-first PWA with service worker support
- Low bandwidth mode
- India Risk / Heat Map visualisation
- Standards Explorer and Certification Guide
- Safety alerts and product comparison tools
- Light / Dark mode
- Government of India styled UI

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (PWA)                │
│  React 18 + TypeScript + Vite + Tailwind CSS    │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Pages    │ │Components│ │  Offline Data  │  │
│  │ BISHome   │ │ Hero     │ │ Knowledge Base │  │
│  │ BISChat   │ │ Scanner  │ │ EN / HI        │  │
│  │ Standards │ │ RiskMap  │ │ Service Worker │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / REST
┌────────────────────▼────────────────────────────┐
│              Backend (Supabase)                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Edge Functions (Deno)           │    │
│  │  • rag-search           (AI chat)       │    │
│  │  • analyze-product-image (vision AI)    │    │
│  │  • home-safety-report   (PDF reports)   │    │
│  │  • crawl-bis            (data ingestion)│    │
│  └──────────────┬──────────────────────────┘    │
│                 │                               │
│  ┌──────────────▼──────────────────────────┐    │
│  │           Groq API                      │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  Database (PostgreSQL + pgvector)       │    │
│  │  • product_reports    • safety_alerts   │    │
│  │  • product_reviews    • scan_history    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
├── public/                     # Static assets, PWA icons, GeoJSON maps
├── src/
│   ├── assets/                 # Images (Ashoka Chakra, etc.)
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── BISHeader.tsx       # GOI-styled header with nav
│   │   ├── Hero.tsx            # Landing hero (low-bandwidth aware)
│   │   ├── SmartSafetyAssistant.tsx
│   │   ├── OfflineSafetyAssistant.tsx
│   │   ├── HouseholdScanner.tsx
│   │   ├── IndiaRiskMap.tsx
│   │   └── ...
│   ├── data/
│   │   ├── products.ts
│   │   ├── offlineKnowledgeBase.ts
│   │   └── offlineKnowledgeMultilingual.ts  # EN / HI translations
│   ├── hooks/
│   │   ├── useOnlineStatus.ts
│   │   ├── useLowBandwidth.tsx
│   │   ├── useAuth.tsx
│   │   └── use-mobile.tsx
│   ├── integrations/supabase/  # Auto-generated client & types
│   ├── pages/
│   │   ├── BISHome.tsx         # Main landing page
│   │   ├── BISChat.tsx         # Ask BIS AI — chat interface
│   │   ├── CertificationGuide.tsx
│   │   ├── StandardsExplorer.tsx
│   │   ├── RiskMapPage.tsx
│   │   └── AboutBIS.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Design tokens & Tailwind
├── supabase/
│   └── functions/
│       ├── rag-search/         # RAG-based AI streaming chat
│       ├── analyze-product-image/
│       ├── home-safety-report/
│       └── crawl-bis/          # BIS website crawler
├── scripts/bis/
│   ├── scrape.mjs              # Scrape BIS pages
│   ├── ingest.py               # Embed & store in pgvector
│   └── sync.mjs                # Sync scraped data
├── data/bis-scraped/           # Raw scraped BIS content
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.9+ (for ingestion script)
- A [Supabase](https://supabase.com) project with pgvector enabled
- A [Groq](https://console.groq.com) API key

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/nimrawani04/bis-ai.git
cd bis-ai

# 2. Install dependencies
npm install

# 3. Copy env and fill in your keys
cp .env.example .env

# 4. Start development server
npm run dev
# App runs at http://localhost:8080
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key
```

### Data Pipeline (RAG)

```bash
# Scrape BIS website
npm run scrape:bis

# Embed and ingest into Supabase pgvector
npm run ingest:bis

# Or sync both steps
npm run sync:bis
```

---

## How It Works

1. BIS website pages are scraped and stored in `data/bis-scraped/`
2. Content is chunked, embedded, and stored in Supabase pgvector
3. On user query, relevant chunks are retrieved by similarity search
4. Groq API generates a response grounded in the retrieved context
5. Response is streamed to the UI with source citations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Maps | react-simple-maps, TopoJSON |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions), Firebase |
| AI | Groq API |
| Vector Search | pgvector (Supabase) |
| PWA | vite-plugin-pwa |
| Testing | Vitest, Testing Library |

---

## License

MIT

---

### Developers

- **Nimra Wani** — [Portfolio](https://nimrawani.vercel.app/)
- **Milad Ajaz Bhat** — [Portfolio](https://m4milaad.github.io/)
